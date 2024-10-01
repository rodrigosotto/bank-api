const express = require("express");
const dotenv = require("dotenv");
const app = express();
const port = process.env.PORT || 3000;
const pool = require("./db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io"); // Certifique-se de importar corretamente o Socket.IO
dotenv.config();

app.use(express.json());
app.use(cors());

// Criação do servidor HTTP
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Origem do frontend
    methods: ["GET", "POST"],
  },
});

// Teste de rota simples
app.get("/", (req, res) => {
  res.send("API de contas bancárias");
});

// Endpoint para criar conta
app.post("/accounts", async (req, res) => {
  const { name, balance } = req.body;

  if (!name || balance === undefined) {
    return res.status(400).json({ error: "Nome e saldo são obrigatórios" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO accounts (name, balance) VALUES (?, ?)",
      [name, balance]
    );
    res.status(201).json({ id: result.insertId, name, balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar conta" });
  }
});

// Endpoint para realizar transferência
app.post("/transfer", async (req, res) => {
  const { account_from, account_to, amount } = req.body;

  if (!account_from || !account_to || !amount) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [fromAccount] = await connection.query(
      "SELECT balance FROM accounts WHERE id = ?",
      [account_from]
    );
    if (fromAccount.length === 0)
      return res.status(404).json({ error: "Conta de origem não encontrada" });
    if (fromAccount[0].balance < amount)
      return res.status(400).json({ error: "Saldo insuficiente" });

    const [toAccount] = await connection.query(
      "SELECT balance FROM accounts WHERE id = ?",
      [account_to]
    );
    if (toAccount.length === 0)
      return res.status(404).json({ error: "Conta de destino não encontrada" });

    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [amount, account_from]
    );
    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [amount, account_to]
    );

    await connection.query(
      "INSERT INTO transactions (account_from, account_to, amount) VALUES (?, ?, ?)",
      [account_from, account_to, amount]
    );

    await connection.commit();

    const newBalanceFrom = fromAccount[0].balance - amount;
    const newBalanceTo = toAccount[0].balance + amount;

    // Emiti evento de transferência via Socket.IO
    io.emit("transfer", {
      account_from,
      account_to,
      amount,
      new_balance_from: newBalanceFrom,
      new_balance_to: newBalanceTo,
    });

    res.json({ message: "Transferência realizada com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao realizar transferência:", error);
    res
      .status(500)
      .json({
        error: "Erro ao realizar transferência",
        details: error.message,
      });
  } finally {
    connection.release();
  }
});

app.get("/accounts", async (req, res) => {
  try {
    const [accounts] = await pool.query("SELECT * FROM accounts");
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contas" });
  }
});


app.get("/transactions", async (req, res) => {
  try {
    const [transactions] = await pool.query("SELECT * FROM transactions");
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar transações" });
  }
});


io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});


server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
