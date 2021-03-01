import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';

import initView from './view.js';

const prepareUrl = (url) => `https://hexlet-allorigins.herokuapp.com/raw?url=${encodeURIComponent(url)}`;

const getFeed = (url) => {
  const preparedUrl = prepareUrl(url);
  const data = axios.get(preparedUrl)
    .then((res) => res.data);
  return data;
};

const parseRSS = (string) => {
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

const validate = (url) => {
  const schema = yup.string().trim().url().required();

  return schema.validate(url)
    .then(() => true)
    .catch(() => false);
};

export default () => {
  const state = {
    form: {
      status: 'filling',
      message: '',
    },
    feeds: [],
    posts: [],
  };

  const elements = {
    input: document.querySelector('[name="url"]'),
    button: document.querySelector('[type="submit"'),
    feedsBlock: document.querySelector('.feeds'),
    postsBlock: document.querySelector('.posts'),
    feedback: document.querySelector('.feedback'),
  };

  const watched = initView(state, elements);

  const form = document.querySelector('#rss-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = formData.get('url');

    watched.form.status = 'proccessing';

    const isValidUrl = validate(url);

    if (!isValidUrl) {
      watched.form.message = 'Ссылка должна быть валидным URL';
      watched.form.status = 'failed';
      return;
    }

    const isExistInFeed = state.feeds.some((feed) => feed.url === url);

    if (isExistInFeed) {
      watched.form.message = 'RSS уже существует';
      watched.form.status = 'failed';
      return;
    }

    getFeed(url)
      .then((data) => parseRSS(data))
      .then(({ title, description, posts }) => {
        const feedId = _.uniqueId();
        watched.feeds.push({
          id: feedId,
          title,
          description,
          url,
        });

        const linkedPosts = posts.map((post) => {
          const newPost = { ...post, feedId };
          return newPost;
        });
        watched.posts.push(...linkedPosts);

        watched.form.message = 'RSS успешно загружен';
        watched.form.status = 'success';
      })
      .catch(() => {
        watched.form.message = 'Ресурс не содержит валидный RSS';
        watched.form.status = 'failed';
      });
  });
};
