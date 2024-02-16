const { Chain, Account, Asset } = require('qtest-js');
const { setup, getAccountPerm, getActivePermission } = require('./setup');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Config test', () => {
  let chain;
  let user1, user2, user3, eosio;
  let gameContract;
  let GameActivePermission;
  let gameId;
  let tokenContract;
  beforeAll(async () => {
    ({
      chain,
      gameContract,
      eosio,
      user1,
      user2,
      user3,
      oracle,
      GameActivePermission,
      orngContract,
      orngOracle,
      tokenContract,
    } = await setup());
  }, 60000);

  afterAll(async () => {
    await chain.clear();
  }, 10000);

  async function showGame() {
    let game = await gameContract.contract.table['games'].getLastRow({
      scope: gameContract.name,
    });
    console.log(game);
  }

  describe('Game Test', function () {
    it('should create game and receive first turn', async () => {
      let res = await gameContract.contract.action.create(
        {
          host: user1.name,
          challenger: user2.name,
        },
        getActivePermission([user1])
      );

      let rows = await gameContract.contract.table['games'].getRows({
        scope: gameContract.name,
      });
      gameId = rows[0].id;

      await orngContract.contract.action.setrand(
        {
          job_id: 0,
          random_value: '124',
        },
        getActivePermission([orngOracle])
      );

      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });

      expect(game.winner).toEqual('none');
      expect(game.turn).toEqual(user1.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(user2.name);
    });

    it('making game move and get winner', async () => {
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 0,
          column: 0,
        },
        getActivePermission([user1])
      );

      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user2.name,
          row: 1,
          column: 0,
        },
        getActivePermission([user2])
      );

      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 0,
          column: 1,
        },
        getActivePermission([user1])
      );

      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user2.name,
          row: 1,
          column: 1,
        },
        getActivePermission([user2])
      );

      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 0,
          column: 2,
        },
        getActivePermission([user1])
      );

      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });
      expect(game.winner).toEqual(user1.name);
      let balance = await tokenContract.contract.table['accounts'].getLastRow({
        scope: user1.name,
      });
      expect(balance.balance).toEqual('10.0000 TIC');

      // remove game
      await gameContract.contract.action.close(
        {
          game_id: gameId,
        },
        getActivePermission([user1])
      );
    });
  });

  describe('Play with bot - user turn first', function () {
    it('should create game and receive first turn', async () => {
      let res = await gameContract.contract.action.create(
        {
          host: user1.name,
          challenger: gameContract.name,
        },
        getActivePermission([user1])
      );

      let rows = await gameContract.contract.table['games'].getRows({
        scope: gameContract.name,
      });
      gameId = rows[0].id;

      await orngContract.contract.action.setrand(
        {
          job_id: 1,
          random_value: '124',
        },
        getActivePermission([orngOracle])
      );

      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });

      expect(game.winner).toEqual('none');
      expect(game.turn).toEqual(user1.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(gameContract.name);
    });

    it('should play first turn and bot create another turn', async () => {
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 0,
          column: 0,
        },
        getActivePermission([user1])
      );

      let res = await orngContract.contract.action.setrand(
        {
          job_id: 2,
          random_value: '124',
        },
        getActivePermission([orngOracle])
      );

      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });

      expect(game.winner).toEqual('none');
      expect(game.turn).toEqual(user1.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(gameContract.name);
    });

    it('should user1 win', async () => {
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 1,
          column: 0,
        },
        getActivePermission([user1])
      );

      await orngContract.contract.action.setrand(
        {
          job_id: 3,
          random_value: '125',
        },
        getActivePermission([orngOracle])
      );

      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 2,
          column: 0,
        },
        getActivePermission([user1])
      );
      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });

      expect(game.winner).toEqual(user1.name);
      expect(game.turn).toEqual(gameContract.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(gameContract.name);

      // remove game
      await gameContract.contract.action.close(
        {
          game_id: gameId,
        },
        getActivePermission([user1])
      );
    });
  });

  describe('Play with bot - bot first turn', function () {
    it('should create game and bot turn first', async () => {
      let res = await gameContract.contract.action.create(
        {
          host: user1.name,
          challenger: gameContract.name,
        },
        getActivePermission([user1])
      );

      await orngContract.contract.action.setrand(
        {
          job_id: 4,
          random_value: '1209',
        },
        getActivePermission([orngOracle])
      );

      let game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });
      gameId = game.id;

      // bot receive first turn
      expect(game.winner).toEqual('none');
      expect(game.turn).toEqual(gameContract.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(gameContract.name);
    });

    it('should play with bot and bot win', async () => {
      // bot first move
      await orngContract.contract.action.setrand(
        {
          job_id: 5,
          random_value: '129',
        },
        getActivePermission([orngOracle])
      );

      //user move
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 2,
          column: 2,
        },
        getActivePermission([user1])
      );

      //bot move
      await orngContract.contract.action.setrand(
        {
          job_id: 6,
          random_value: '123',
        },
        getActivePermission([orngOracle])
      );

      //user move
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 1,
          column: 1,
        },
        getActivePermission([user1])
      );

      //bot move
      await orngContract.contract.action.setrand(
        {
          job_id: 7,
          random_value: '001',
        },
        getActivePermission([orngOracle])
      );

      //user move
      await gameContract.contract.action.move(
        {
          game_id: gameId,
          by: user1.name,
          row: 1,
          column: 2,
        },
        getActivePermission([user1])
      );

      //bot move
      await orngContract.contract.action.setrand(
        {
          job_id: 8,
          random_value: '001',
        },
        getActivePermission([orngOracle])
      );

      game = await gameContract.contract.table['games'].getLastRow({
        scope: gameContract.name,
      });

      expect(game.winner).toEqual(gameContract.name);
      expect(game.turn).toEqual(user1.name);
      expect(game.host).toEqual(user1.name);
      expect(game.challenger).toEqual(gameContract.name);
    });
  });
});
