import { CommandInteraction, Client, ApplicationCommandType, ApplicationCommandOptionType } from "discord.js"
import { Command } from "../command.js"

export const Character: Command = {
    name: "character",
    description: "Returns details about the given character (Data from https://aldata.earthiverse.ca)",
    options: [
        {
            description: "Character Name",
            name: "character",
            required: true,
            type: ApplicationCommandOptionType.String
        }
    ],
    type: ApplicationCommandType.ChatInput,
    run: async (client: Client, interaction: CommandInteraction) => {
        const character = interaction.options.get("character").value
        console.log(character)
        try {
            const getData = await fetch(`https://aldata.earthiverse.ca/character/${character}`)

            if (getData.status === 200) {
                const json = await getData.json()
                await interaction.followUp({
                    ephemeral: true,
                    content: `Here's the latest data I have for \`${character}\` 🙂\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``
                })
            }
        } catch (e) {
            console.error(e)

            await interaction.followUp({
                ephemeral: true,
                content: `Sorry, I had an error finding data for \`${character}\`. 😥`
            })
        }
    }
}
