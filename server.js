const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

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

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", function (req, res) {
  res.sendFile(__dirname + "/write.html");
});

// add画面のpost
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
  });
});

// todo list 確認ページ
app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray((e, result) => {
      console.log(result);
      res.render("list.ejs", { posts: result });
    });
});
