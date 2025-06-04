require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers,
  ],
  partials: ['USER', 'GUILD_MEMBER', 'PRESENCE'],
});

app.get('/api/status', async (req, res) => {
  try {
    const userId = process.env.USER_ID;

    // Busca o usuário com dados atualizados
    const user = await client.users.fetch(userId, { force: true });

    const guilds = client.guilds.cache;

    let presence = null;
    let boosting = false;

    for (const [, guild] of guilds) {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        if (!presence && member.presence) presence = member.presence;
        if (member.premiumSince) boosting = true;
      }
    }

    const flags = user.flags?.toArray() || [];
    const hasNitro = user.premiumType === 1 || user.premiumType === 2;

    const statusData = {
      username: `${user.username}#${user.discriminator}`,
      avatar: user.displayAvatarURL({ dynamic: true, size: 256 }),
      flags,
      status: presence?.status || 'offline',
      activities: presence?.activities.map(a => ({
        type: a.type,
        name: a.name,
        details: a.details,
        state: a.state,
      })) || [],
      nitro: hasNitro,
      boosting,
    };

    fs.writeFileSync('statusCache.json', JSON.stringify(statusData, null, 2));

    res.json(statusData);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

client.once('ready', () => {
  console.log(`🤖 Bot logado como ${client.user.tag}`);
  console.log('⚠️ Lembrete: O bot precisa estar nos servidores que o usuário boosta e ter as permissões "GUILD_MEMBERS" e "GUILD_PRESENCES" ativas no Dev Portal.');
});

app.listen(PORT, () => {
  console.log(`🌐 Site rodando em http://localhost:${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
