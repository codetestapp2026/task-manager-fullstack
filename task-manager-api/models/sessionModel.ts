import mongoose = require("mongoose");

interface ISession {
  user: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema =
  new mongoose.Schema<ISession>(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      refreshTokenHash: {
        type: String,
        required: true,
      },

      expiresAt: {
        type: Date,
        required: true,
      },

      revoked: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    },
  );

const Session =
  mongoose.model<ISession>(
    "Session",
    sessionSchema,
  );

export = Session;