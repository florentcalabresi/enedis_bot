const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const axios = require('axios');
const got = require('got');
const config  = require('./config.json');
const XMLHttpRequest = require('xhr2');

const API_GOUV_ADDRESS_ENDPOINTS = "https://api-adresse.data.gouv.fr/search/";
const USER_AGENT_ENEDIS = "demo";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'request') {
        
        let address = interaction.options.getString('adresse');
        let responseFinal;
        address = encodeURI(address)

        let xtick0;

        axios({
            method: 'get',
            url: API_GOUV_ADDRESS_ENDPOINTS+"?q="+address,
            responseType: 'json'
        })
        .then(async function (response) {
            let dataApiAddress = response.data;
            if(dataApiAddress.features.length == 0) return await interaction.reply('Aucune adresse n\'a été trouvé via votre recherche.');
            let propertiesAddress = dataApiAddress.features[0].properties;
            console.log(propertiesAddress)

            curlTokenEnedis().then((response) => {
                console.log(response)
                let token = JSON.parse(response).token;
                let addressFormat = encodeURI(propertiesAddress.label)
                axios({
                    method: 'get',
                    url: "https://megacache.p.web-enedis.fr/v2/shedding?street="+addressFormat+"&insee_code="+propertiesAddress.citycode,
                    responseType: 'json',
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(async function (response) {
                    responseFinal = response.data;
                    console.log(responseFinal)

                    const resultEnedisEmbed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setURL('https://www.enedis.fr/')
                        .setDescription('Voici les résultats obtenue par Enedis à votre adresse ("'+propertiesAddress.label+'").')
                        .setTimestamp()
                        .setFooter({ text: 'Enedis', iconURL: 'https://d3v4jsc54141g1.cloudfront.net/uploads/mentor/avatar/1575105/normal_Enedis_Icone_couleur_RVB_300_dpi-1552312893.png' });

                    resultEnedisEmbed.addFields({name: "Résultat",value: ((responseFinal.shedding.length > 0) ? "Coupures prévus" : "Coupures non prévus")})
                    if(responseFinal.shedding.length > 0){
                        let listShedding = array();
                        responseFinal.shedding.forEach(element => {
                            listShedding.push("Commence le "+element.start_date+" et finis le "+element.stop_date+"\n")
                        });
            
                        resultEnedisEmbed.addFields({name: "Coupures", value: listShedding})
                    }

                    await interaction.reply({embeds: [resultEnedisEmbed], ephemeral: true})
                })
                .catch(async function (err) {
                    console.log(err)
                    await interaction.reply("Une erreur est survenue: "+err)
                });
            });
        })
        .catch(async function (err) {
            await interaction.reply("Une erreur est survenue: "+err)
        });


        /*axios({
            method: 'get',
            url: API_GOUV_ADDRESS_ENDPOINTS+"?q="+address,
            responseType: 'json'
        })
        .then(async function (response) {
            let dataApiAddress = response.data;
            if(data.features.length == 0) return await interaction.reply('Aucune adresse n\'a été trouvé via votre recherche.');
            let propertiesAddress = dataApiAddress.features[0].properties;

        })
        .catch(async function (err) {
            await interaction.reply('Une erreur est survenue avec l\'API');
        });*/
    }
});

function curlTokenEnedis(){

    return new Promise((resolve, reject) => {
        var url = "https://megacache.p.web-enedis.fr/v2/g/trace";

        var xhr = new XMLHttpRequest();
        xhr.open("POST", url);
    
        xhr.setRequestHeader("User-Agent", "demo");
        xhr.setRequestHeader("Content-Type", "application/json");
    
        xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            resolve(xhr.responseText);
        }};
    
        var data = '{"step": "4ce11df475e1aa63d7d1437d18e8c9c29718f31843d31d65549b2e82638aa982"}';
    
        xhr.send(data);
    })
}

client.login(config.TOKEN);