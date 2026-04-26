const mongoose = require('mongoose');

let _supportsTransactions;

const mongoSupportsTransactions = async () => {
  if (_supportsTransactions !== undefined) return _supportsTransactions;

  try {
    const db    = mongoose.connection?.db;
    if (!db) { _supportsTransactions = false; return false; }

    const admin = db.admin();
    const hello = await admin.command({ hello: 1 }).catch(() =>
      admin.command({ isMaster: 1 })
    );
    _supportsTransactions = Boolean(hello?.setName || hello?.msg === 'isdbgrid');
  } catch {
    _supportsTransactions = false;
  }

  return _supportsTransactions;
};

const runWithOptionalTransaction = async (work) => {
  const supported = await mongoSupportsTransactions();

  if (!supported) {
    return work({ session: null });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await work({ session });
    await session.commitTransaction();
    return result;
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }
    throw err;
  } finally {
    await session.endSession();
  }
};

module.exports = { mongoSupportsTransactions, runWithOptionalTransaction };
