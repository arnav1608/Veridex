const express = require("express");
const router = express.Router();

const Discussion = require("../models/Discussion");

const authMiddleware = require("../middleware/authMiddleware");
const { discussionLimitMiddleware } = require("../middleware/rateLimitMiddleware");

function addReplyRecursive(replies, parentId, newReply) {
  for (let r of replies) {
    if (r.id === parentId) {
      r.replies = r.replies || [];
r.replies.push(newReply);
      return true;
    }

    if (r.replies && r.replies.length) {
      const added = addReplyRecursive(r.replies, parentId, newReply);
      if (added) return true;
    }
  }
  return false;
}

/* =======================
   CREATE POST
======================= */
router.post(
  "/",
  authMiddleware,
  discussionLimitMiddleware,
  async (req, res) => {
    try {
      const { claimId, type, content, link, image, poll, id } = req.body;

      /* ===============================
         CREATE POST
      =============================== */

      const post = await Discussion.create({
        id,
        claimId: "global",
        author: req.user._id,
        type,
        content,
        link,
        image,
        poll,
        votes: { up: [], down: [] },
        replies: []
      });

      res.json(post);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);
/* =======================
   GET POSTS
======================= */
router.get("/", async (req, res) => {
  try {
    const { claimId = "global" } = req.query;

    const posts = await Discussion.find({
      isDeleted: false
    })
      .populate("author", "email role")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "email role"
        }
      })
      .sort({ createdAt: -1 });

    res.json(posts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   VOTE ON POST
======================= */
router.post("/:postId/vote", authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;

    if (!["up", "down"].includes(type)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const post = await Discussion.findOne({ id: req.params.postId });

    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;

    post.votes.up = post.votes.up.filter(
      (u) => u.toString() !== userId.toString()
    );
    post.votes.down = post.votes.down.filter(
      (u) => u.toString() !== userId.toString()
    );

    post.votes[type].push(userId);

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   VOTE ON POLL
======================= */
router.post("/:postId/poll", authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;

    const post = await Discussion.findOne({ id: req.params.postId });

    if (!post || !post.poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    const userId = req.user._id;

    post.poll.options.forEach(option => {
      option.votes = option.votes.filter(
        u => u.toString() !== userId.toString()
      );
    });

    post.poll.options[optionIndex].votes.push(userId);

    await post.save();
    res.json(post);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   DELETE POST
======================= */
router.delete("/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Discussion.findOne({ id: req.params.postId });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isOwner =
      post.author.toString() === req.user._id.toString();

    const isModerator = req.user.role === "moderator";

    if (!isOwner && !isModerator) {
      return res.status(403).json({
        error: "Not allowed to delete this post"
      });
    }

    if (!isModerator) {
      const hoursSinceCreation =
        (Date.now() - new Date(post.createdAt)) /
        (1000 * 60 * 60);

      if (req.user.role === "regular" && hoursSinceCreation > 0.17) {
        return res.status(403).json({
          error: "Regular users can delete only within 10 minutes"
        });
      }

      if (
        req.user.role === "verified" &&
        hoursSinceCreation > 24
      ) {
        return res.status(403).json({
          error: "Verified users can delete within 24 hours"
        });
      }
    }

    post.isDeleted = true;
    await post.save();

    res.json({ message: "Post deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   ADD REPLY
======================= */
router.post(
  "/:postId/reply",
  authMiddleware,
  discussionLimitMiddleware,
  async (req, res) => {
    try {
      const post = await Discussion.findOne({
        id: req.params.postId
      });

      if (!post || post.isDeleted) {
        return res.status(404).json({ error: "Post not found" });
      }

      const newReply = {
  ...req.body,
  author: req.user._id,
  replies: []
};

// Try nested insert
const added = addReplyRecursive(post.replies, req.body.parentId, newReply);

// If not found → top-level
if (!added) {
  post.replies.push(newReply);
}

      await post.save();

      res.json(post);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;