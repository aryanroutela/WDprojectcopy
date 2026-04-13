const app = require("./app");
const PORT = 3000;

app.listen(PORT, () => {
  console.log(` Server chal raha hai: http://localhost:${PORT}`);
});