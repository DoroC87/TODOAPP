const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// 外部ライブラリ：method-override
const methodOverride = require("method-override");
const { Db } = require("mongodb");
app.use(methodOverride("_method"));

// DBの接続
var db;

app.listen(8080, function () {
  MongoClient.connect(
    "mongodb+srv://admin:pw1234@cluster0.kbtphjb.mongodb.net/?retryWrites=true&w=majority",
    (e, client) => {
      // エラー検知
      if (e) return console.log(e);

      db = client.db("todoapp");
    }
  );
});

// [Home]初期表示
app.get("/", function (req, res) {
  res.render("index.ejs");
});
// [Write]初期表示
app.get("/write", function (req, res) {
  res.render("write.ejs");
});

// [Write]submitボタン押下
// Dbへinsert処理
app.post("/add", function (req, res) {
  // idのauto_increment情報検索
  db.collection("counter").findOne({ name: "datacount" }, (e, result) => {
    let totalcount = result.totalPost;
    // 画面で入力した情報をDBへ登録
    db.collection("post").insertOne(
      { _id: totalcount, title: req.body.title, date: req.body.date },
      (e, result) => {
        console.log("insert complete!");
        // idのauto_increment増加
        db.collection("counter").updateOne(
          { name: "datacount" },
          { $inc: { totalPost: 1 } },
          (e, result) => {
            return console.log(e);
          }
        );
      }
    );
    res.redirect("/list");
  });
});

// [List]初期表示
app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray((e, result) => {
      res.render("list.ejs", { posts: result });
    });
});

// [List]削除ボタン押下
// Dbへdelete処理
app.delete("/delete", (req, res) => {
  //idを数字に変換
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, (e, result) => {
    console.log("Delete Complete!");
    res.status(200).send({ message: "Complete" });
  });
});

// [Detail]初期表示
app.get("/detail/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("detail.ejs", { data: result });
    }
  );
});

// [Edit]初期表示
app.get("/edit/:id", (req, res) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (e, result) => {
      res.render("edit.ejs", { data: result });
    }
  );
});

// [Edit]modifyボタン押下
// Dbへupdate処理
app.put("/modify", (req, res) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (e, result) => {
      console.log("Modify Complete!");
      res.redirect("/list");
    }
  );
});
