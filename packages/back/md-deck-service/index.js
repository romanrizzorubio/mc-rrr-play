import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3002);

app.get('/healthz', (_req, res) => {
    res.json({status: 'ok'});
});
app.use((_req, res) => {
    res.status(404).json({
        error: {
            message: 'No se encontró la ruta solicitada.',
            status: 404,
        },
    });
});

app.listen(port, () => {
    console.log(`deck service running at http://localhost:${port}`);
});
