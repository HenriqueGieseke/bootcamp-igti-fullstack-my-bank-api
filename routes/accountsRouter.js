import express from 'express';
import { accountModel } from '../models/accountModel.js';

const app = express();

//mostrar todas as contas
app.get('/accounts', async (req, res) => {
  try {
    const accounts = await accountModel.find({});
    res.send(accounts);
  } catch (error) {
    res.status(500).send(error);
  }
});

//consultar saldo
app.get('/checkBalance/:ag/:acc', async (req, res) => {
  try {
    const { ag, acc } = req.params;

    const account = await accountModel.findOne({ agencia: ag, conta: acc });

    if (!account) {
      res.send(
        `Conta não encontrada. Você buscou agência:${ag} e conta:${acc}.`
      );
    }

    res.send(
      `O saldo da conta:${acc}(agência:${ag}) é de: ${account.balance}.`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//depositar
app.patch('/deposit/:ag/:acc/:value', async (req, res) => {
  try {
    const { ag, acc, value } = req.params;

    const account = await accountModel.findOne({ agencia: ag, conta: acc });

    if (!account) {
      res.send(
        `Conta não encontrada. Você buscou agência:${ag} e conta:${acc}.`
      );
    }

    account.balance = account.balance + parseInt(value);

    account.save();

    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

//saque
app.patch('/withdraw/:ag/:acc/:value', async (req, res) => {
  try {
    const { ag, acc, value } = req.params;

    const account = await accountModel.findOne({ agencia: ag, conta: acc });

    if (!account) {
      res.send(
        `Conta não encontrada. Você buscou agência:${ag} e conta:${acc}.`
      );
    }

    if (account.balance - 1 >= value) {
      account.balance = account.balance - parseInt(value) - 1;

      account.save();

      res.send(account);
    } else {
      res.send(
        `Saldo insuficiente, você pediu para sacar ${value}(+1 de imposto), mas seu saldo é ${account.balance}.`
      );
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//deletar
app.delete('/delete/:ag/:acc', async (req, res) => {
  try {
    const { ag, acc } = req.params;

    const accountDeleted = await accountModel.findOneAndDelete({
      agencia: ag,
      conta: acc,
    });

    const accountsInAgency = await accountModel.find({ agencia: ag });

    res.send(
      `Conta ${accountDeleted.conta} da agência ${accountDeleted.agencia}, foi deletada. Restam ${accountsInAgency.length} contas na agência ${accountDeleted.agencia}.`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//transferir
app.patch('/transfer/:accOrigin/:accDestiny/:value', async (req, res) => {
  try {
    const { accOrigin, accDestiny, value } = req.params;

    const originAccount = await accountModel.findOne({ conta: accOrigin });
    const destinyAccount = await accountModel.findOne({ conta: accDestiny });

    if (!originAccount || !destinyAccount) {
      res.send(
        `Contas não encontradas. Você mandou as contas ${accOrigin}, de origem, e ${accDestiny} de destino.`
      );
    } else if (
      originAccount.balance - 8 >= parseInt(value) &&
      originAccount.agencia !== destinyAccount.agencia
    ) {
      originAccount.balance = originAccount.balance - parseInt(value) - 8;
      destinyAccount.balance = destinyAccount.balance + parseInt(value);

      originAccount.save();
      destinyAccount.save();

      res.send(originAccount);
    } else if (
      originAccount.balance >= parseInt(value) &&
      originAccount.agencia === destinyAccount.agencia
    ) {
      originAccount.balance = originAccount.balance - parseInt(value);
      destinyAccount.balance = destinyAccount.balance + parseInt(value);

      originAccount.save();
      destinyAccount.save();

      res.send(originAccount);
    } else {
      res.send(
        `Saldo insuficiente, você pediu para tranferir ${value}(+8 caso seja entre agências diferentes), mas seu saldo é ${originAccount.balance}.`
      );
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

//media de saldo da agencia
app.get('/balanceAverage/:ag', async (req, res) => {
  try {
    const { ag } = req.params;

    const agAccounts = await accountModel.find({ agencia: ag });

    if (agAccounts.length === 0) {
      res.send(`Agência não encontrada. Você buscou a agência:${ag}.`);
    }

    let totalBalance = 0;

    agAccounts.forEach((acc) => {
      totalBalance += acc.balance;
    });

    const balanceAverage = Math.floor(totalBalance / agAccounts.length);

    res.send(
      `O saldo total das contas da agência:${ag} é ${totalBalance}. A média dos saldos é ${balanceAverage}.`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

//consultar menores saldos
app.get('/lowerBalance/:listSize', async (req, res) => {
  try {
    const { listSize } = req.params;

    const accounts = await accountModel.find({});

    let accountsInOrder = accounts.sort((a, b) => {
      return a.balance - b.balance;
    });

    accountsInOrder = accountsInOrder.slice(0, parseInt(listSize));

    res.send(accountsInOrder);
  } catch (error) {
    res.status(500).send(error);
  }
});

//consultar maiores saldos
app.get('/higherBalance/:listSize', async (req, res) => {
  try {
    const { listSize } = req.params;

    const accounts = await accountModel.find({});

    let accountsInOrder = accounts.sort((a, b) => {
      return b.balance - a.balance;
    });

    accountsInOrder = accountsInOrder.slice(0, parseInt(listSize));

    res.send(accountsInOrder);
  } catch (error) {
    res.status(500).send(error);
  }
});

//clientes prime - um cliente com maior saldo de cada agência
app.patch('/prime', async (req, res) => {
  try {
    const accounts = await accountModel.find({});

    let topClients = [];
    let agencies = [];

    for (let acc of accounts) {
      agencies.push(acc.agencia);
    }
    const uniqueAgencies = [...new Set(agencies)];

    for (let i = 0; i < uniqueAgencies.length; i++) {
      let agency = accounts
        .filter((acc) => {
          let filter = uniqueAgencies[i];
          return acc.agencia === filter;
        })
        .sort((a, b) => {
          return b.balance - a.balance;
        });
      const primeClient = agency[0];
      const findPrimeClient = await accountModel.findOne({
        _id: primeClient._id,
      });
      findPrimeClient.agencia = 99
      findPrimeClient.save()

      topClients.push(findPrimeClient);
    }

    res.send(topClients);
  } catch (error) {
    res.status(500).send(error);
  }
});

export { app as accountsRouter };
