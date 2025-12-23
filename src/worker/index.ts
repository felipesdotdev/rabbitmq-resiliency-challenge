import { connect } from "../lib/queue";

const QUEUE_NAME = "reports_queue";
const DLQ_NAME = "reports_dlq";
const DLX_NAME = "reports_dlx";

async function startWorker() {
	const { channel } = await connect();

	await channel.assertQueue(DLQ_NAME, { durable: true });

	await channel.assertExchange(DLX_NAME, "direct", { durable: true });

	await channel.bindQueue(DLQ_NAME, DLX_NAME, "dead");

	await channel.assertQueue(QUEUE_NAME, {
		durable: true,
		arguments: {
			"x-dead-letter-exchange": DLX_NAME,
			"x-dead-letter-routing-key": "dead",
		},
	});

	channel.prefetch(1);

	console.log("👷 Worker iniciado! Aguardando jobs...");

	channel.consume(QUEUE_NAME, async (msg) => {
		if (!msg) return;

		const content = JSON.parse(msg.content.toString());
		console.log(`[🔄] Processando relatório para User: ${content.userId}...`);

		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			if (Math.random() < 0.2) {
				throw new Error("Falha aleatória na geração do PDF!");
			}

			console.log(`[✅] Relatório gerado com sucesso!`);

			channel.ack(msg);
		} catch (error) {
			console.error(`[❌] Erro no processamento: ${(error as Error).message}`);
			const headers = msg.properties.headers || {};
			const retryCount = headers["x-retry-count"] || 0;

			if (retryCount < 3) {
				console.log(
					`[wm] Tentativa ${retryCount + 1}/3 falhou. Reenfileirando...`,
				);

				channel.sendToQueue(QUEUE_NAME, msg.content, {
					headers: { ...headers, "x-retry-count": retryCount + 1 },
					persistent: true,
				});

				channel.ack(msg);
			} else {
				console.error(
					"[💀] Máximo de tentativas excedido. Enviando para DLQ (via Nack).",
				);

				channel.nack(msg, false, false);
			}
		}
	});
}

startWorker();
