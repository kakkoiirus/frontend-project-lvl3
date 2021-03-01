import onChange from 'on-change';
import i18n from 'i18next';
import resources from './locales';

const init = (state) => {
  i18n.init({
    lng: state.language,
    resources,
  });
};

const renderForm = (form, elements) => {
  const { input, button, feedback } = elements;
  switch (form.status) {
    case 'filling':
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
      break;

    case 'proccessing':
      input.setAttribute('disabled', true);
      button.setAttribute('disabled', true);
      break;

    case 'failed':
      input.classList.add('is-invalid');
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t(form.message);
      input.select();
      break;

    case 'success':
      input.value = '';
      input.classList.remove('is-invalid');
      input.removeAttribute('disabled');
      button.removeAttribute('disabled');
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t(form.message);
      input.select();
      break;

    default:
      throw Error(`Неизвестный статус: ${form.status}`);
  }
};

const renderFeeds = (feeds, elements) => {
  const { feedsBlock } = elements;
  feedsBlock.innerHTML = '';

  if (feeds.length === 0) {
    return;
  }

  const list = document.createElement('ul');
  feeds.forEach((feed) => {
    const item = document.createElement('li');
    const header = document.createElement('h3');
    const description = document.createElement('p');
    header.textContent = feed.title;
    description.textContent = feed.description;
    item.appendChild(header);
    item.appendChild(description);
    list.appendChild(item);
  });

  feedsBlock.appendChild(list);
};

const renderPosts = (posts, elements) => {
  const { postsBlock } = elements;
  postsBlock.innerHTML = '';

  if (posts.length === 0) {
    return;
  }

  const list = document.createElement('ul');
  posts.forEach((post) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.textContent = post.title;
    link.href = post.url;
    item.appendChild(link);
    list.appendChild(item);
  });

  postsBlock.appendChild(list);
};

export default (state, elements) => {
  const mapping = {
    'form.status': () => renderForm(state.form, elements),
    feeds: () => renderFeeds(state.feeds, elements),
    posts: () => renderPosts(state.posts, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  init(state);

  return watchedState;
};
