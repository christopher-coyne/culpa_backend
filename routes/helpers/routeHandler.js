const routeHandler = async (callback, res) => {
  try {
    await callback();
  } catch (e) {
    console.log("server error: ", e);
    res.status(500);
    res.json({ serverError: e.message });
  }
};

module.exports = routeHandler;
