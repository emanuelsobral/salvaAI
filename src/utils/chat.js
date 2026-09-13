export function completedChatHistory(history) {
  const result = [];
  for (let index = 0; index < history.length - 1; index++) {
    const question = history[index], answer = history[index + 1];
    if (question.role === 'user' && answer.role === 'model' && !answer.isError) {
      result.push({ role: 'user', parts: question.parts }, { role: 'model', parts: answer.parts });
      index++;
    }
  }
  return result.slice(-20);
}
