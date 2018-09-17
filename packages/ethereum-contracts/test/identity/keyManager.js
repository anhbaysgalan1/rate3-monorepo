import {
    AccountsSetupConfig,
    setupTest,
    assertKeyCount,
    Purpose,
    KeyType,
} from './base';
import {
    printTestGas,
    assertOkTx,
    assertRevert,
} from './util';

contract('KeyManager', async (addrs) => {
    let identity;
    let accounts;

    afterEach('print gas', printTestGas);

    beforeEach('new contract', async () => {
        const config = (new AccountsSetupConfig())
            .setAnotherAccount(addrs[0])
            .setIdentityAccount(addrs[1])
            .pushAccount(Purpose.MANAGEMENT, addrs[2])
            .pushAccount(Purpose.MANAGEMENT, addrs[3], false)
            .pushAccount(Purpose.ACTION, addrs[4])
            .pushAccount(Purpose.ACTION, addrs[5], false)
            .pushAccount(Purpose.CLAIM, addrs[6], false)
            .pushAccount(Purpose.ENCRYPT, addrs[7], false);

        ({ identity, accounts } = await setupTest(config));
    });

    describe('addKey', async () => {
        it('should not add the same key twice', async () => {
            const initial = await identity.numKeys();

            // Start with 2
            await assertKeyCount(identity, Purpose.ACTION, 2);

            await assertOkTx(identity.addKey(
                accounts.action[2].key,
                Purpose.ACTION,
                KeyType.ECDSA,
                { from: accounts.manager[0].addr },
            ));
            await assertOkTx(identity.addKey(
                accounts.action[2].key,
                Purpose.ACTION,
                KeyType.ECDSA,
                { from: accounts.manager[1].addr },
            ));

            // End with 3
            await assertKeyCount(identity, Purpose.ACTION, 3);

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial.add(1));
        });

        it('should add only for management keys', async () => {
            const initial = await identity.numKeys();

            // Start with 2
            await assertKeyCount(identity, Purpose.ACTION, 2);

            await assertRevert(identity.addKey(
                accounts.action[2].key,
                Purpose.ACTION,
                KeyType.ECDSA,
                { from: accounts.action[1].addr },
            ));
            await assertRevert(identity.addKey(
                accounts.action[2].key,
                Purpose.ACTION,
                KeyType.ECDSA,
                { from: accounts.action[1].addr },
            ));

            // End with 2
            await assertKeyCount(identity, Purpose.ACTION, 2);

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial);
        });

        it('should add multi-purpose keys', async () => {
            const initial = await identity.numKeys();

            // Start with 2
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);
            await assertKeyCount(identity, Purpose.ACTION, 2);

            await assertOkTx(identity.addKey(
                accounts.action[1].key,
                Purpose.MANAGEMENT,
                KeyType.ECDSA,
                { from: accounts.manager[0].addr },
            ));
            await assertOkTx(identity.addKey(
                accounts.manager[1].key,
                Purpose.ACTION,
                KeyType.ECDSA,
                { from: accounts.manager[0].addr },
            ));

            // End with 3
            await assertKeyCount(identity, Purpose.MANAGEMENT, 3);
            await assertKeyCount(identity, Purpose.ACTION, 3);

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial);
        });
    });

    describe('removeKey', async () => {
        it('should remove multi-purpose keys', async () => {
            // Start with 2
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);
            await assertKeyCount(identity, Purpose.ACTION, 2);

            // Add ACTION as MANAGEMENT
            await assertOkTx(identity.addKey(
                accounts.action[1].key,
                Purpose.MANAGEMENT,
                KeyType.ECDSA,
                { from: accounts.manager[0].addr },
            ));
            await assertKeyCount(identity, Purpose.MANAGEMENT, 3);

            assert.isTrue(await identity.keyHasPurpose(
                accounts.action[1].key,
                Purpose.MANAGEMENT,
            ));

            // Remove MANAGEMENT
            await assertOkTx(identity.removeKey(
                accounts.manager[0].key,
                Purpose.MANAGEMENT,
                { from: accounts.action[1].addr },
            ));
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);

            // Remove MANAGEMENT
            await assertOkTx(identity.removeKey(
                accounts.manager[1].key,
                Purpose.MANAGEMENT,
                { from: accounts.action[1].addr },
            ));
            await assertKeyCount(identity, Purpose.MANAGEMENT, 1);

            // Remove ACTION
            await assertOkTx(identity.removeKey(
                accounts.action[1].key,
                Purpose.ACTION,
                { from: accounts.action[1].addr },
            ));
            await assertKeyCount(identity, Purpose.ACTION, 1);

            // Storage is clean
            const [purposes, keyType, key] = await identity.getKey(
                accounts.action[1].key,
            );
            keyType.should.be.bignumber.equal(KeyType.ECDSA);
            assert.equal(key, accounts.action[1].key);
            assert.equal(purposes.length, 1);
        });

        it('should remove existing key', async () => {
            const initial = await identity.numKeys();

            // Start with 2
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);

            // Remove 1
            await assertOkTx(identity.removeKey(
                accounts.manager[1].key,
                Purpose.MANAGEMENT,
                { from: accounts.manager[0].addr },
            ));
            await assertKeyCount(identity, Purpose.MANAGEMENT, 1);

            // Remove self
            await assertRevert(identity.removeKey(
                accounts.manager[0].key,
                Purpose.MANAGEMENT,
                { from: accounts.manager[0].addr },
            ));
            await assertKeyCount(identity, Purpose.MANAGEMENT, 1);

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial.sub(1));
        });

        it('should remove only for management keys', async () => {
            const initial = await identity.numKeys();

            // Start with 2
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);

            await assertRevert(identity.removeKey(
                accounts.manager[0].key,
                Purpose.MANAGEMENT,
                { from: accounts.action[1].addr },
            ));
            await assertRevert(identity.removeKey(
                accounts.manager[1].key,
                Purpose.MANAGEMENT,
                { from: accounts.action[1].addr },
            ));

            // End with 2
            await assertKeyCount(identity, Purpose.MANAGEMENT, 2);

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial);
        });

        it('should ignore keys that don\'t exist', async () => {
            const initial = await identity.numKeys();

            await assertKeyCount(identity, Purpose.ENCRYPT, 0);

            await assertOkTx(identity.removeKey(
                accounts.encrypt[0].key,
                Purpose.ENCRYPT,
                { from: accounts.manager[0].addr },
            ));

            const total = await identity.numKeys();
            total.should.be.bignumber.equal(initial);
        });
    });

    // TODO: test KeyAdded, KeyRemoved
});
