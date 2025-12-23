import amqp from "amqplib";

const RABBITMQ_URL = "amqp://app:app@localhost:5672";

export async function connect() {
	try {
		const connection = await amqp.connect(RABBITMQ_URL);
		const channel = await connection.createChannel();
		return { connection, channel };
	} catch (error) {
		console.error("Erro ao conectar no RabbitMQ:", error);
		process.exit(1);
	}
}
