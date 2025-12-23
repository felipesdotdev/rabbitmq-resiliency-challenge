import express from "express";
import { connect } from "../lib/queue";

const app = express();
app.use(express.json());

const QUEUE_NAME = "reports_queue";
const DLX_NAME = "reports_dlx";

app.post("/reports", async (req, res) => {
	const { userId, type } = req.body;

	const { channel } = await connect();

	await channel.assertQueue(QUEUE_NAME, {
		durable: true,
		arguments: {
			"x-dead-letter-exchange": DLX_NAME,
			"x-dead-letter-routing-key": "dead",
		},
	});

	const message = JSON.stringify({ userId, type, createdAt: new Date() });

	channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
		persistent: true,
	});

	console.log(`[x] Pedido enviado para fila: ${message}`);

	res.status(202).json({
		message: "Relatório solicitado com sucesso! Processando em background.",
		status: "pending",
	});
});

app.listen(3000, () => {
	console.log("🚀 API Producer rodando na porta 3000");
});
