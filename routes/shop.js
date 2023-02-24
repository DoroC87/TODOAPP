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

router.get("/shirts", (req, res) => {
  res.send("셔츠 파는 페이지");
});
router.get("/pants", (req, res) => {
  res.send("바지 파는 페이지");
});

module.exports = router;
