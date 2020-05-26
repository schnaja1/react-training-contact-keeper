const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const User = require("../modules/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../middleware/auth");

// @route     GET api/auth
// @desc      Get logged in user
// @access    Private
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// @route     POST api/auth
// @desc      Auth user and get token
// @access    Public

router.post(
  "/",
  [
    check("email", "Please inlude a valid email").isEmail(),
    check("password", "Please include password").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res
          .status(400)
          .json({ msg: "Invalid credentials provided - user does not exist" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          msg: "Invalid credentials provided - password is not correct",
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 3600000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
