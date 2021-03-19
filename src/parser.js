export default (string) => {
  const domparser = new DOMParser();
  const document = domparser.parseFromString(string, 'application/xml');

  const errors = document.querySelectorAll('parsererror');

  if (errors.length > 0) {
    throw new Error('Parsing error');
  }

  const title = document.querySelector('title').textContent;
  const description = document.querySelector('description').textContent;

  const items = document.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postUrl = item.querySelector('link').textContent;

    return { title: postTitle, description: postDescription, url: postUrl };
  });

  return { title, description, posts };
};
