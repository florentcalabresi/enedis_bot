const { REST, Routes } = require('discord.js');
const config  = require('./config.json');

const commands = [
  {
    name: 'request',
    description: 'Savoir si mon adresse sera coupée en électricité',
    options: [
        {
            type: 3,
            name: "adresse",
            description: "Veuillez saisir le nom de votre adresse + le nom de votre ville",
            required: true
        }
    ]
  },
];

const rest = new REST({ version: '10' }).setToken(config.TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();