exports.serverErrorMessage = res => {
  res.status(500).json({ msg: 'حدث خطأ ما، برجاء المحاولة مره اخري لاحقا' });
};

exports.removeDuplicates = arr => {
  return [...new Set(arr)];
};

exports.dailySalesBalance = (dailySales, paid) => {
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

exports.sendResponse = (res, msg, code = 422) => {
  if (typeof msg === 'string') return res.status(code).json({ msg });
  return res.status(code).json(msg);
};

exports.reverseArr = arr => arr.reverse();
