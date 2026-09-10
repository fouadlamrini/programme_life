const timeBlockService = require('../services/timeBlockService');

// userId دائماً من الـ token (req.userId) — لا نثق في أي userId من body/params/query

const createTimeBlock = async (req, res) => {
  try {
    const result = await timeBlockService.createTimeBlock({
      userId: req.userId,
      programmeDate: req.params.date,
      body: req.body
    });
    return res.status(201).json(result);
  } catch (error) {
    const status = error.httpStatus || 500;
    return res.status(status).json({
      message: status === 500 ? 'حدث خطأ في السيرفر' : error.message,
      error: status === 500 ? error.message : undefined
    });
  }
};

const listTimeBlocks = async (req, res) => {
  try {
    const result = await timeBlockService.listTimeBlocks({
      userId: req.userId,
      programmeDate: req.params.date
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.httpStatus || 500;
    return res.status(status).json({
      message: status === 500 ? 'حدث خطأ في السيرفر' : error.message,
      error: status === 500 ? error.message : undefined
    });
  }
};

const getTimeBlock = async (req, res) => {
  try {
    const block = await timeBlockService.getTimeBlock({
      userId: req.userId,
      programmeDate: req.params.date,
      blockId: req.params.blockId
    });
    return res.status(200).json({ timeBlock: block });
  } catch (error) {
    const status = error.httpStatus || 500;
    return res.status(status).json({
      message: status === 500 ? 'حدث خطأ في السيرفر' : error.message,
      error: status === 500 ? error.message : undefined
    });
  }
};

const updateTimeBlock = async (req, res) => {
  try {
    const result = await timeBlockService.updateTimeBlock({
      userId: req.userId,
      programmeDate: req.params.date,
      blockId: req.params.blockId,
      body: req.body
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.httpStatus || 500;
    return res.status(status).json({
      message: status === 500 ? 'حدث خطأ في السيرفر' : error.message,
      error: status === 500 ? error.message : undefined
    });
  }
};

const deleteTimeBlock = async (req, res) => {
  try {
    const result = await timeBlockService.deleteTimeBlock({
      userId: req.userId,
      programmeDate: req.params.date,
      blockId: req.params.blockId
    });
    return res.status(200).json(result);
  } catch (error) {
    const status = error.httpStatus || 500;
    return res.status(status).json({
      message: status === 500 ? 'حدث خطأ في السيرفر' : error.message,
      error: status === 500 ? error.message : undefined
    });
  }
};

module.exports = {
  createTimeBlock,
  listTimeBlocks,
  getTimeBlock,
  updateTimeBlock,
  deleteTimeBlock
};