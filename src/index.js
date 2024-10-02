const express = require("express");
const dotenv = require("dotenv");
const app = express();
const port = process.env.PORT || 3000;
const pool = require("./db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", //pode ser necesario trocar
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

app.get("/", (req, res) => {
  res.send("API de contas bancárias");
});

app.get("/accounts/check-name", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Nome é obrigatório" });
  }

  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM accounts WHERE name = ?",
      [name]
    );
    const exists = result[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao verificar nome da conta" });
  }
});

app.post("/accounts", async (req, res) => {
  const { name, balance } = req.body;

  const numericBalance = parseFloat(balance);

  if (!name || isNaN(numericBalance)) {
    return res
      .status(400)
      .json({
        error: "Nome e saldo são obrigatórios e o saldo deve ser um número",
      });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO accounts (name, balance) VALUES (?, ?)",
      [name, numericBalance] // Usar saldo numérico
    );

    return res.status(201).json({
      message: "Conta criada com sucesso",
      id: result.insertId,
      name,
      balance: numericBalance.toFixed(2), // Retorna com 2 casas decimais
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar a conta" });
  }
});

app.post("/transfer", async (req, res) => {
  const { account_from, account_to, amount } = req.body;
  const numericAmount = parseFloat(amount);

  if (!account_from || !account_to || isNaN(numericAmount)) {
    return res
      .status(400)
      .json({
        error: "Todos os campos são obrigatórios e o valor deve ser um número",
      });
  }

  if (account_from === account_to) {
    return res
      .status(400)
      .json({
        error: "Não é possível transferir valores para a própria conta.",
      });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [fromAccount] = await connection.query(
      "SELECT balance FROM accounts WHERE id = ?",
      [account_from]
    );

    if (fromAccount.length === 0) {
      return res.status(404).json({ error: "Conta de origem não encontrada" });
    }

    if (fromAccount[0].balance < numericAmount) {
      return res.status(400).json({ error: "Saldo insuficiente" });
    }

    const [toAccount] = await connection.query(
      "SELECT balance FROM accounts WHERE id = ?",
      [account_to]
    );

    if (toAccount.length === 0) {
      return res.status(404).json({ error: "Conta de destino não encontrada" });
    }

    // Realiza a transferência
    await connection.query(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [numericAmount, account_from]
    );
    await connection.query(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [numericAmount, account_to]
    );

    await connection.query(
      "INSERT INTO transactions (account_from, account_to, amount) VALUES (?, ?, ?)",
      [account_from, account_to, numericAmount]
    );

    await connection.commit();

    const newBalanceFrom = fromAccount[0].balance - numericAmount;
    const newBalanceTo = toAccount[0].balance + numericAmount;

    io.emit("transfer", {
      account_from,
      account_to,
      amount: numericAmount,
      new_balance_from: newBalanceFrom,
      new_balance_to: newBalanceTo,
    });

    res.json({ message: "Transferência realizada com sucesso" });
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao realizar transferência:", error);

    res.status(500).json({
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

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
