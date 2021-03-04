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

const prepareUrl = (url) => `https://hexlet-allorigins.herokuapp.com/raw?url=${encodeURIComponent(url)}`;

const getFeed = (url) => {
  const preparedUrl = prepareUrl(url);
  const data = axios.get(preparedUrl)
    .then((res) => res.data);
  return data;
};

const validate = (url, feeds) => {
  setLocale({
    string: {
      default: 'messages.errors.invalidUrl',
      url: 'messages.errors.invalidUrl',
    },
  });

  const schema = yup
    .string()
    .trim()
    .url()
    .notOneOf(feeds, 'messages.errors.alreadyExist')
    .required();

  try {
    schema.validateSync(url);
    return null;
  } catch (err) {
    return err.message;
  }
};

const handleFeed = (url, feed, state) => {
  const { title, description } = feed;
  const feedId = _.uniqueId();

  state.feeds.push({
    id: feedId,
    title,
    description,
    url,
  });

  return feedId;
};

const handlePosts = (feedId, feed, state) => {
  const { posts } = feed;

  const linkedPosts = posts.map((post) => {
    const postId = _.uniqueId();
    const newPost = { id: postId, ...post, feedId };
    return newPost;
  });

  const postsDiff = _.differenceBy(linkedPosts, state.posts, 'url');
  state.posts.unshift(...postsDiff);
};

const updatePosts = (state) => {
  state.feeds.forEach((feed) => {
    const { id, url } = feed;

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((rss) => handlePosts(id, rss, state));
  });

  setInterval(updatePosts, UPDATE_INTERVAL, state);
};

export default () => {
  const i18nextInstance = i18next.createInstance();
  i18nextInstance.init({
    lng: 'ru',
    resources,
  });

  const state = {
    form: {
      status: 'filling',
      message: '',
    },
    feeds: [],
    posts: [],
    language: 'ru',
    updateTimerId: null,
    ui: {
      posts: {
        watched: [],
      },
      modal: {
        title: '',
        description: '',
        url: '',
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

  const watched = initView(state, elements, i18nextInstance);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    watched.form.status = 'proccessing';

    const feedList = state.feeds.map((feed) => feed.url);

    const error = validate(url, feedList);
    if (error) {
      watched.form.message = error;
      watched.form.status = 'failed';
      return;
    }

    getFeed(url)
      .then((data) => parseRSS(data))
      .then((feed) => {
        const feedId = handleFeed(url, feed, watched);
        handlePosts(feedId, feed, watched);
      })
      .then(() => {
        watched.form.message = 'messages.success.loaded';
        watched.form.status = 'success';
      })
      .then(() => {
        if (!state.updateTimerId) {
          state.updateTimerId = setTimeout(updatePosts, UPDATE_INTERVAL, watched);
        }
      })
      .catch(() => {
        watched.form.message = 'messages.errors.wrongResource';
        watched.form.status = 'failed';
      });
  });

  elements.postsBlock.addEventListener('click', (e) => {
    const postId = e.target.dataset.id;

    if (postId) {
      e.stopPropagation();
      watched.ui.posts.watched.push(postId);
    }

    if (e.target.dataset.bsTarget === '#modal') {
      const { title, description, url } = state.posts.find((post) => post.id === postId);
      watched.ui.modal = {
        title,
        description,
        url,
      };
    }
  });
};
