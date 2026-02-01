const express = require("express");
const router = express.Router();

// Simple demo routes
router.get("/", (req, res) => {
    res.json({ success: true, message: "Accounts API working" });
});

router.get("/ledger", (req, res) => {
    res.json({ success: true, data: [] });
});

router.get("/balance-sheet", (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;

