require('@babel/register');
require('@babel/polyfill');

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development: {
            host: 'localhost',
            port: 8545,
            network_id: '*',
            gas: 4700000,
        },
    },
    solc: { optimizer: { enabled: true, runs: 200 } },
};
