require('dotenv').config();
const Application = require('./src/Application');

const port = Number(process.env.PORT || 3000);
const application = new Application();
const server = application.app.listen(port, () => {
  console.log(`FindMySpecialist running at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    application.userRepository.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
