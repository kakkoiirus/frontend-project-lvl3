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

const prepareUrl = (url) => {
  const preparedUrl = new URL('/get', 'https://hexlet-allorigins.herokuapp.com/');
  const params = new URLSearchParams({
    disableCache: true,
    url,
  });

  preparedUrl.search = params;

  return preparedUrl.href;
};

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

  return isFeedExist
    ? _.differenceBy(linkedPosts, state.posts, 'url')
    : linkedPosts;
};

const updatePosts = (state) => {
  state.feeds.forEach((feed) => {
    const { url } = feed;

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((rss) => {
        const postDiff = handleFeed(url, rss, state);
        state.posts.unshift(...postDiff);
        setTimeout(updatePosts, UPDATE_INTERVAL, state);
      });
  });
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

  setLocale({
    string: {
      default: 'messages.errors.invalidUrl',
      url: 'messages.errors.invalidUrl',
    },
  });

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

        watched.form.message = '';
        watched.form.status = 'filling';

        watched.loadingProccess.status = 'loading';
        getFeed(url)
          .then((data) => {
            const rss = parseRSS(data);
            const posts = handleFeed(url, rss, watched);
            watched.posts.unshift(...posts);
            watched.loadingProccess.message = 'messages.success.loaded';
            watched.loadingProccess.status = 'idle';
          })
          .catch((err) => {
            if (err.request) {
              watched.loadingProccess.message = 'messages.errors.network';
            } else {
              watched.loadingProccess.message = 'messages.errors.wrongResource';
            }

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
