import app from './app'

const PORT = Number(process.env.PORT) || 3000;

app.listen({ port: PORT }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server running on port ${PORT}`);
});
