import onChange from 'on-change';

const renderForm = (form, elements, i18n) => {
  const { input, button, feedback } = elements;
  switch (form.status) {
    case 'filling':
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      button.removeAttribute('disabled');
      break;

    case 'proccessing':
      input.setAttribute('disabled', true);
      input.setAttribute('readonly', '');
      button.setAttribute('disabled', true);
      break;

    case 'failed':
      input.classList.add('is-invalid');
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
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
      input.removeAttribute('readonly');
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

const renderFeeds = (feeds, elements, i18n) => {
  const { feedsBlock } = elements;
  feedsBlock.innerHTML = '';

  if (feeds.length === 0) {
    return;
  }

  const title = document.createElement('h2');
  title.textContent = i18n.t('feeds.title');
  const list = document.createElement('ul');
  list.classList.add('list-group', 'mb-5');

  feeds.forEach((feed) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item');
    const header = document.createElement('h3');
    const description = document.createElement('p');
    header.textContent = feed.title;
    description.textContent = feed.description;
    item.appendChild(header);
    item.appendChild(description);
    list.appendChild(item);
  });

  feedsBlock.appendChild(title);
  feedsBlock.appendChild(list);
};

const renderPosts = (state, elements, i18n) => {
  const { posts, ui } = state;
  const { watchedPosts } = ui;

  const { postsBlock } = elements;
  postsBlock.innerHTML = '';

  if (posts.length === 0) {
    return;
  }

  const title = document.createElement('h2');
  title.textContent = i18n.t('posts.title');
  const list = document.createElement('ul');
  list.classList.add('list-group');

  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');

    const link = document.createElement('a');
    const linkClasses = watchedPosts.has(post.id) ? ['fw-normal', 'font-weight-normal'] : ['fw-bold', 'font-weight-bold'];
    link.classList.add(...linkClasses);
    link.dataset.id = post.id;
    link.target = '_blank';

    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.dataset.bsToggle = 'modal';
    button.dataset.bsTarget = '#modal';
    button.dataset.id = post.id;
    button.textContent = i18n.t('posts.button');

    link.textContent = post.title;
    link.href = post.url;
    item.appendChild(link);
    item.appendChild(button);
    list.appendChild(item);
  });

  postsBlock.appendChild(title);
  postsBlock.appendChild(list);
};

const fillModal = (state, elements) => {
  const { postId } = state.ui.modal;
  const { modalTitle, modalBody, modalLink } = elements;
  const { title, description, url } = state.posts.find((post) => post.id === postId);

  modalTitle.textContent = title;
  modalBody.textContent = description;
  modalLink.href = url;
};

export default (state, elements, i18n) => {
  const mapping = {
    'form.status': () => renderForm(state.form, elements, i18n),
    feeds: () => renderFeeds(state.feeds, elements, i18n),
    posts: () => renderPosts(state, elements, i18n),
    'ui.watchedPosts': () => renderPosts(state, elements, i18n),
    'ui.modal.postId': () => fillModal(state, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};
