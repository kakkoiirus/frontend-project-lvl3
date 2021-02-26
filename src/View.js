import onChange from 'on-change';

export default class {
  constructor(state) {
    this.state = state;
  }

  init() {
    this.feedbackElement = document.querySelector('.feedback');
    this.feedsElement = document.querySelector('.feeds');
    this.postsElement = document.querySelector('.posts');
    this.inputElement = document.querySelector('[name="url"]');

    this.watchedFormState = onChange(this.state.form, (path) => {
      const { status, validationState } = this.watchedFormState;
      if (path === 'status' && validationState === 'invalid') {
        this.feedbackElement.classList.add('text-danger');
        this.inputElement.classList.add('is-invalid');
        this.feedbackElement.innerHTML = status;
      }

      if (path === 'status' && validationState === 'valid') {
        this.feedbackElement.classList.remove('text-danger');
        this.inputElement.classList.remove('is-invalid');
        this.inputElement.value = '';
        this.feedbackElement.classList.add('text-success');
        this.feedbackElement.innerHTML = status;
      }
    });

    this.watchedFeedsState = onChange(this.state.feeds, () => {
      this.renderFeeds();
    });

    this.watchedPostsState = onChange(this.state.posts, () => {
      this.renderPosts();
    });
  }

  renderFeeds() {
    const { feeds } = this.state;

    this.feedsElement.innerHTML = '';

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

    this.feedsElement.appendChild(list);
  }

  renderPosts() {
    const { posts } = this.state;

    this.postsElement.innerHTML = '';

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

    this.postsElement.appendChild(list);
  }
}
