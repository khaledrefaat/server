serverErrorMessage = res => {
  res
    .status(500)
    .json({ message: 'حدث خطأ ما، برجاء المحاولة مره اخري لاحقا' });
};

dailySalesBalance = (dailySales, paid) => {
  let lastBalance = 0;

  for (let i = dailySales.length - 1; i >= 0; i--) {
    const itemMoney = dailySales[i].money;
    if (itemMoney && typeof itemMoney.balance === 'number') {
      lastBalance = dailySales[i].money.balance;
      break;
    }
  }
  return parseFloat(lastBalance) + parseFloat(paid);
};

sendResponse = (res, msg, code = 422) => {
  if (typeof msg === 'string') return res.status(code).json({ message: msg });
  return res.status(code).json(msg);
};

reverseArr = arr => arr.reverse();

sortArr = arr => arr.sort((a, b) => new Date(b.date) - new Date(a.date));

function calcTraysCount(trays) {
  let traysCount = 0;

  for (tray of trays) {
    if (tray.expense) traysCount -= tray.expense;
    else if (tray.income) traysCount += tray.income;
  }
  return traysCount;
}

module.exports = {
  serverErrorMessage,
  dailySalesBalance,
  sendResponse,
  reverseArr,
  sortArr,
  calcTraysCount,
};
