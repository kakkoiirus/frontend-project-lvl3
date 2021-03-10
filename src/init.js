import 'bootstrap';
import * as yup from 'yup';
import { setLocale } from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';

import resources from './locales';
import initView from './view.js';
import parseRSS from './parser.js';

const UPDATE_INTERVAL = 20000;

setLocale({
  string: {
    default: 'messages.errors.invalidUrl',
    url: 'messages.errors.invalidUrl',
  },
});

const prepareUrl = (url) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(url)}`;

const getFeed = (url) => {
  const preparedUrl = prepareUrl(url);
  const data = axios.get(preparedUrl)
    .then((res) => res.data.contents);
  return data;
};

const validate = (url, feeds) => {
  const feedUrls = feeds.map((feed) => feed.url);

  const schema = yup
    .string()
    .trim()
    .url()
    .notOneOf(feedUrls, 'messages.errors.alreadyExist')
    .required();

  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
};

const handleFeed = (url, feed, state) => {
  const { title, description, posts } = feed;

  const isFeedExist = state.feeds.some((item) => item.url === url);

  if (!isFeedExist) {
    state.feeds.push({
      url,
      title,
      description,
    });
  }

  const linkedPosts = posts.map((post) => {
    const postId = _.uniqueId();
    const newPost = { id: postId, ...post, feedUrl: url };
    return newPost;
  });

  const postsDiff = _.differenceBy(linkedPosts, state.posts, 'url');
  state.posts.unshift(...postsDiff);
};

const updatePosts = (state) => {
  state.feeds.forEach((feed) => {
    const { url } = feed;

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((rss) => handleFeed(url, rss, state));
  });

  setTimeout(updatePosts, UPDATE_INTERVAL, state);
};

export default () => {
  const i18nextInstance = i18next.createInstance();

  const state = {
    form: {
      status: 'filling',
      message: '',
    },
    loadingProccess: {
      status: 'idle',
      message: '',
    },
    feeds: [],
    posts: [],
    updateTimerId: null,
    ui: {
      watchedPosts: new Set(),
      modal: {
        postId: null,
      },
    },
  };

  const elements = {
    form: document.querySelector('#rss-form'),
    input: document.querySelector('[name="url"]'),
    button: document.querySelector('[type="submit"'),
    feedsBlock: document.querySelector('.feeds'),
    postsBlock: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalLink: document.querySelector('.full-article'),
  };

  i18nextInstance.init({
    lng: 'ru',
    resources,
  })
    .then(() => {
      const watched = initView(state, elements, i18nextInstance);

      setTimeout(updatePosts, UPDATE_INTERVAL, watched);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const url = formData.get('url');

        const error = validate(url, state.feeds);
        if (error) {
          watched.form.message = error;
          watched.form.status = 'invalid';
          return;
        }

        watched.loadingProccess.status = 'loading';
        getFeed(url)
          .then((data) => {
            try {
              const rss = parseRSS(data);
              handleFeed(url, rss, watched);
              watched.form.status = 'filling';
              watched.form.message = '';
              watched.loadingProccess.message = 'messages.success.loaded';
              watched.loadingProccess.status = 'idle';
            } catch (err) {
              watched.loadingProccess.message = 'messages.errors.wrongResource';
              watched.loadingProccess.status = 'failed';
            }
          })
          .catch(() => {
            watched.loadingProccess.message = 'messages.errors.network';
            watched.loadingProccess.status = 'failed';
          });
      });

      elements.postsBlock.addEventListener('click', (e) => {
        const postId = e.target.dataset.id;

        if (postId) {
          e.stopPropagation();
          watched.ui.watchedPosts.add(postId);
          watched.ui.modal.postId = postId;
        }
      });
    });
};
