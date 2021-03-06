import { Message, VoiceChannel } from "discord.js"

import { VcState } from "../vc-state"
import { Handler } from "../handler"

export class InviteVcHandler implements Handler {
  constructor(private state: VcState ) {}
  async run(message: Message, matched: RegExpMatchArray) {
    const channelName = matched[1]
    if(message.guild) {
      const voiceChannel = message.guild.channels.cache.find(channel => channel.name === channelName)
      if(voiceChannel && voiceChannel.type === "voice") {
        await (voiceChannel as VoiceChannel).join()
        this.state.currentJoinedVoiceChannel = (voiceChannel as VoiceChannel)
        message.reply("参加した")
      }
    }
  }
}
