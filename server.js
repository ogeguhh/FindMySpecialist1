
const Application = require('./src/Application');

const app = new Application().app;

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);

  app.listen(port, () => {
    console.log(
      `FindMySpecialist running on port ${port}`
    );
  });
}

module.exports = app;
