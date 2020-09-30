import pkg from "mongoose"
const { Schema } = pkg

const EntitySchema = new Schema({
    name: String,
    map: String,
    x: Number,
    y: Number,
    serverRegion: String,
    serverIdentifier: String,
    type: String,
    level: { type: Number, required: false },
    hp: { type: Number, required: false },
    lastSeen: { type: Number, required: false }
})

EntitySchema.index({ serverRegion: 1, serverIdentifier: 1, name: 1 }, { unique: true })
EntitySchema.index({ lastSeen: 1 })

export default EntitySchema