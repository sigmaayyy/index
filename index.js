  const express = require('express');
  const app = express();
  const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

  app.get('/', (req, res) => {
    res.send('Bot is alive!');
  });

  app.listen(3000, () => {
    console.log('Server is running!');
  });

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  // Temporary warn storage
  const warns = new Map();

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const command = args[0];

    // .ping
    if (command === '.ping') {
      return message.channel.send(`Pong! 🏓 Latency is ${client.ws.ping}ms.`);
    }

    // .key
    if (command === '.key') {
      return message.channel.send('🔑 Get key here: https://link-center.net/1354045/key-system');
    }

    // .script
    if (command === '.script') {
      return message.channel.send('📜 Our Script: loadstring(game:HttpGet("https://raw.githubusercontent.com/sigmaayyy/badge-hub-auto/refs/heads/main/badge-auto.lua"))()');
    }

    // .ban
    if (command === '.ban') {
      if (!message.member.permissions.has('BanMembers')) {
        return message.channel.send("You don't have permission to ban members.");
      }
      const userMention = args[1];
      const reason = args.slice(2).join(' ') || 'No reason provided';
      const userId = userMention?.replace(/[<@!>]/g, '');
      const user = message.guild.members.cache.get(userId);
      if (!user) return message.channel.send('User not found.');

      try {
        await user.ban({ reason });
        message.channel.send(`${user.user.tag} has been banned for: ${reason}`);
      } catch (err) {
        console.error(err);
        message.channel.send("I couldn't ban that user.");
      }
    }

    // .unban
    if (command === '.unban') {
      if (!message.member.permissions.has('BanMembers')) return message.channel.send("You don't have permission.");
      const userId = args[1];
      const reason = args.slice(2).join(' ') || 'No reason provided';
      try {
        const bans = await message.guild.bans.fetch();
        if (!bans.has(userId)) return message.channel.send('That user is not banned.');
        await message.guild.members.unban(userId, reason);
        message.channel.send(`Unbanned user ID ${userId}. Reason: ${reason}`);
      } catch (err) {
        console.error(err);
        message.channel.send("Couldn't unban the user.");
      }
    }

    // .kick
    if (command === '.kick') {
      if (!message.member.permissions.has('KickMembers')) return message.channel.send("You don't have permission.");
      const userMention = args[1];
      const reason = args.slice(2).join(' ') || 'No reason provided';
      const userId = userMention?.replace(/[<@!>]/g, '');
      const user = message.guild.members.cache.get(userId);
      if (!user) return message.channel.send("User not found.");

      try {
        await user.kick(reason);
        message.channel.send(`${user.user.tag} has been kicked for: ${reason}`);
      } catch (err) {
        console.error(err);
        message.channel.send("Couldn't kick the user.");
      }
    }

    // .blist
    if (command === '.blist') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.channel.send("You don't have permission to view bans.");
      }
      try {
        const bans = await message.guild.bans.fetch();
        if (bans.size === 0) return message.channel.send('🚫 No users are banned.');

        const embed = new EmbedBuilder()
          .setTitle('🔨 Ban List')
          .setColor('Red')
          .setDescription(`Total Banned Users: **${bans.size}**`)
          .addFields(
            [...bans.values()].slice(0, 25).map(ban => ({
              name: ban.user.tag,
              value: `ID: \`${ban.user.id}\`\nReason: ${ban.reason || 'No reason'}`,
              inline: false
            }))
          );

        if (bans.size > 25) {
          embed.addFields({ name: '\u200B', value: '*Only showing first 25 bans*' });
        }

        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        message.channel.send("Couldn't fetch ban list.");
      }
    }

    // .purge
    if (command === '.purge') {
      if (!message.member.permissions.has('ManageMessages')) return message.channel.send("No permission.");
      const amount = parseInt(args[1]);
      if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
        return message.channel.send('Provide a number between 1-100.');
      }
      try {
        await message.delete();
        const deleted = await message.channel.bulkDelete(amount, true);
        const msg = await message.channel.send(`🧹 Deleted ${deleted.size} messages.`);
        setTimeout(() => msg.delete(), 5000);
      } catch (err) {
        console.error(err);
        message.channel.send("Messages may be too old to delete.");
      }
    }

    // .warn
    if (command === '.warn') {
      if (!message.member.permissions.has('ManageMessages')) return message.channel.send("❌ No permission.");
      const user = message.mentions.users.first();
      const reason = args.slice(2).join(' ') || 'No reason';
      if (!user) return message.channel.send("Mention a user.");
      const userId = user.id;
      if (!warns.has(userId)) warns.set(userId, []);
      warns.get(userId).push({ reason, date: new Date(), moderator: message.author.tag });
      message.channel.send(`⚠️ ${user.tag} has been warned for: ${reason}`);
    }

    // .warnlogs
    if (command === '.warnlogs') {
      if (!message.member.permissions.has('ManageMessages')) return message.channel.send("❌ No permission.");
      const user = message.mentions.users.first();
      if (!user) return message.channel.send("Mention a user.");
      const userWarnings = warns.get(user.id);
      if (!userWarnings) return message.channel.send("✅ No warnings.");
      const logs = userWarnings.map((warn, i) => `**${i + 1}.** ${warn.reason} — *${warn.moderator}* on ${warn.date.toLocaleString()}`).join('\n\n');
      message.channel.send(`⚠️ Warnings for <@${user.id}>:\n\n${logs}`);
    }

    // .warnR
    if (command === '.warnR') {
      if (!message.member.permissions.has('ManageMessages')) return message.channel.send("❌ No permission.");
      const user = message.mentions.users.first();
      const index = parseInt(args[2]);
      if (!user || isNaN(index)) return message.channel.send("⚠️ Usage: `.warnR @user <warning number>`");
      const userWarnings = warns.get(user.id);
      if (!userWarnings) return message.channel.send("✅ No warnings.");
      if (index < 1 || index > userWarnings.length) return message.channel.send("❌ Invalid warning number.");
      const removed = userWarnings.splice(index - 1, 1)[0];
      if (userWarnings.length === 0) warns.delete(user.id);
      message.channel.send(`✅ Removed warning #${index} for <@${user.id}>. Reason was: **${removed.reason}**`);
    }

    // .cmds
    if (command === '.cmds') {
      return message.channel.send(`\`\`\`
  .ban        | Ban a user
  .kick       | Kick a user
  .purge      | Bulk delete messages
  .warn       | Warn a user
  .warnlogs   | View warnings
  .warnR      | Remove a warning
  .unban      | Unban a user
  .blist      | List banned users
  .ping       | Check latency
  .cmds       | List commands
  .key        | Link to key system
  .script     | Roblox script
  \`\`\``);
    }

    // .bupdate
    if (command === '.bupdate') {
      const embed = new EmbedBuilder()
        .setTitle('Bot Update')
        .addFields({ name: 'Version', value: '1.0.0' })
        .setColor('Green')
        .setFooter({ text: '1.0.0' })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    // .supdate
    if (command === '.supdate') {
      const embed = new EmbedBuilder()
        .setTitle('Script Update')
        .addFields({ name: 'Version', value: '2.5' })
        .setColor('DarkBlue')
        .setFooter({ text: '2.5' })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    // .role / .roleR
    if (message.member.permissions.has('ManageRoles')) {
      const member = message.mentions.members.first();
      const roleName = args.slice(2).join(' ');
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());

      if (command === '.roleR') {
        if (!member || !role) return message.reply('❌ Usage: `.roleR @user RoleName`');
        try {
          await member.roles.remove(role);
          message.channel.send(`✅ Removed **${role.name}** from ${member.user.tag}`);
        } catch (err) {
          console.error(err);
          message.reply('❌ I couldn’t remove the role.');
        }
      }

      if (command === '.role') {
        if (!member || !role) return message.reply('❌ Usage: `.role @user RoleName`');
        try {
          await member.roles.add(role);
          message.channel.send(`✅ Gave **${role.name}** to ${member.user.tag}`);
        } catch (err) {
          console.error(err);
          message.reply('❌ I couldn’t add the role.');
        }
      }
    }

    // .serverinfo
    if (command === '.serverinfo') {
      const { guild } = message;
      const embed = new EmbedBuilder()
        .setTitle(`Server Info - ${guild.name}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '📛 Server Name', value: guild.name, inline: true },
          { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: '🆔 Server ID', value: guild.id, inline: true },
          { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
          { name: '📄 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '📺 Channels', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🗓️ Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setColor('Aqua')
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    }

    // .userinfo
    if (command === '.userinfo') {
      const target = message.mentions.users.first() || message.author;
      const member = message.guild.members.cache.get(target.id);

      const embed = new EmbedBuilder()
        .setTitle(`User Info - ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 User ID', value: target.id, inline: true },
          { name: '📝 Username', value: target.username, inline: true },
          { name: '📛 Tag', value: target.discriminator, inline: true },
          { name: '🗓️ Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
          { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`, inline: false }
        )
        .setColor('Blue')
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();

      message.channel.send({ embeds: [embed] });
    }
  });

  client.login(process.env.DISCORD_TOKEN);
