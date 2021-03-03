export default (string) => {
  const domparser = new DOMParser();
  const data = domparser.parseFromString(string, 'application/xml');
  const title = data.querySelector('title').textContent;
  const description = data.querySelector('description').textContent;

  const items = data.querySelectorAll('item');
  const posts = Array.from(items).map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postDescription = item.querySelector('description').textContent;
    const postUrl = item.querySelector('link').textContent;

    return { title: postTitle, description: postDescription, url: postUrl };
  });

  return { title, description, posts };
};
