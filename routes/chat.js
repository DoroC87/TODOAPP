var router = require("express").Router();
/**
 * 로그인 체크
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
function loginCheck(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("not LOGIN");
  }
}

router.use(loginCheck);

// 채팅방화면
router.get("/", (req, res) => {
  res.render("chat.ejs");
});

module.exports = router;
