import onChange from 'on-change';

const renderForm = (status, elements) => {
  const { input, button } = elements;
  switch (status) {
    case 'empty':
      input.value = '';
      break;

    case 'filling':
      input.classList.remove('is-invalid');
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      button.removeAttribute('disabled');
      input.select();
      break;

    case 'disabled':
      input.setAttribute('disabled', true);
      input.setAttribute('readonly', '');
      button.setAttribute('disabled', true);
      break;

    case 'invalid':
      input.classList.add('is-invalid');
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      button.removeAttribute('disabled');
      break;

    default:
      throw Error(`Неизвестный статус: ${status}`);
  }
};

const renderFeedback = (status, message, elements, i18n) => {
  const { feedback } = elements;

  switch (status) {
    case 'success':
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = i18n.t(message);
      break;

    case 'error':
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t(message);
      break;

    default:
      throw Error(`Неизвестный статус: ${status}`);
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

const handleFormStatus = (state, elements, i18n) => {
  const { status, message } = state.form;

  switch (status) {
    case 'filling':
      renderForm('filling', elements);
      break;

    case 'invalid':
      renderForm('invalid', elements);
      renderFeedback('error', message, elements, i18n);
      break;

    default:
      throw Error(`Неизвестный статус: ${status}`);
  }
};

const handleLoadingStatus = (state, elements, i18n) => {
  const { status, message } = state.loadingProccess;

  switch (status) {
    case 'loading':
      renderForm('disabled', elements);
      break;

    case 'idle':
      renderForm('empty', elements);
      renderFeedback('success', message, elements, i18n);
      break;

    case 'failed':
      renderForm('filling', elements);
      renderFeedback('error', message, elements, i18n);
      break;

    default:
      throw Error(`Неизвестный статус: ${status}`);
  }
};

export default (state, elements, i18n) => {
  const mapping = {
    'form.status': () => handleFormStatus(state, elements, i18n),
    'loadingProccess.status': () => handleLoadingStatus(state, elements, i18n),
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
