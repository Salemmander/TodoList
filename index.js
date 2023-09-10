import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import process from "process";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

var env = process.env;

mongoose.connect(env["MongoUrl"], {
    useNewURLParser: true,
});

const itemSchema = new mongoose.Schema({
    task: String,
});

const Item = mongoose.model("Item", itemSchema);

const listSchema = new mongoose.Schema({
    name: String,
    list: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
    Item.find({}, { task: 1 }).then(function (foundItems) {
        res.render("index.ejs", {
            listTitle: "Today",
            currentTasks: foundItems,
        });
    });
});

app.get("/:customListName", (req, res) => {
    const listName = req.params.customListName;
    List.findOne({ name: listName }).then(function (foundList) {
        if (!foundList) {
            const list = new List({
                name: listName,
                list: [],
            });
            list.save();
            res.redirect("/" + listName);
        } else {
            res.render("index.ejs", {
                listTitle: foundList.name,
                currentTasks: foundList.list,
            });
        }
    });
});

app.post("/newItem", async (req, res) => {
    const newItem = new Item({
        task: req.body.newItem,
    });
    const listName = req.body.listName;
    if (listName === "Today") {
        await Item.create(newItem);
        res.redirect("/");
    } else {
        await List.findOne({ name: listName }).then(function (foundList) {
            foundList.list.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", async (req, res) => {
    const listName = req.body.listName;
    const itemID = req.body.checkbox;
    if (listName === "Today") {
        await Item.findByIdAndRemove(itemID);
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { list: { _id: itemID } } }
        ).then(function (foundList) {
            res.redirect("/" + listName);
        });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
