// Only complete, successful exchanges go back to the provider.
export function aiHistory(messages) {
  const pairs = [];
  for (let index = 0; index + 1 < messages.length; index++) {
    const user = messages[index], model = messages[index + 1];
    if (user.role === 'user' && model.role === 'model' && !model.isError) {
      pairs.push([user, model].map(item => ({ role: item.role, parts: [{ text: item.parts[0].text.slice(0, 6000) }] })));
      index++;
    }
  }
  return pairs.slice(-10).flat();
}
