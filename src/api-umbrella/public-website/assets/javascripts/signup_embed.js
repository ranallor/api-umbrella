import Modal from 'bootstrap/js/src/modal';
import escapeHtml from 'escape-html';
import serialize from 'form-serialize';
import 'whatwg-fetch'
import 'promise-polyfill/src/polyfill';
import * as params from '@params';

const style = document.createElement('link');
style.rel = 'stylesheet';
style.type = 'text/css';
style.href = params.stylesheetPath;
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(style);

const webSiteRoot = '<%= ENV["WEB_SITE_ROOT"] %>';

const defaults = {
  containerSelector: '#api_umbrella_signup',
  apiUrlRoot: webSiteRoot + '/api-umbrella',
  contactUrl: webSiteRoot + '/contact/',
  exampleApiUrl: webSiteRoot + '/example.json?api_key={{api_key}}',
  signupConfirmationMessage: '',
  sendWelcomeEmail: true,
  websiteInput: false,
  termsCheckbox: true,
  termsUrl: webSiteRoot + '/terms/',
  verifyEmail: false
};
const options = {
  ...defaults,
  ...(apiUmbrellaSignupOptions || {}),
};

if(!options.apiKey) {
  alert('apiUmbrellaSignupOptions.apiKey must be set');
}

if(!options.registrationSource) {
  alert('apiUmbrellaSignupOptions.registrationSource must be set');
}

let signupFormTemplate = `
  <p>Sign up for an application programming interface (API) key to access and use web services available on the Data.gov developer network.</p>
  <p class="required-fields"><abbr title="Required" class="required"><span class="abbr-required">*</span></abbr> Required fields</p>
  <form id="api_umbrella_signup_form" role="form">
    <div class="row mb-3">
      <label class="col-sm-4 col-form-label text-end" for="user_first_name"><abbr title="Required" class="required"><span class="abbr-required">*</span></abbr> First Name</label>
      <div class="col-sm-8">
        <input class="form-control" id="user_first_name" name="user[first_name]" size="50" type="text" required />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-sm-4 col-form-label text-end" for="user_last_name"><abbr title="Required" class="required"><span class="abbr-required">*</span></abbr> Last Name</label>
      <div class="col-sm-8">
        <input class="form-control" id="user_last_name" name="user[last_name]" size="50" type="text" required />
      </div>
    </div>
    <div class="row mb-3">
      <label class="col-sm-4 col-form-label text-end" for="user_email"><abbr title="Required" class="required"><span class="abbr-required">*</span></abbr> Email</label>
      <div class="col-sm-8">
        <input class="form-control" id="user_email" name="user[email]" size="50" type="email" required />
      </div>
    </div>
`;

if(options.websiteInput) {
  signupFormTemplate += `
    <div class="row mb-3">
      <label class="col-sm-4 col-form-label text-end" for="user_website">Website<br />(optional)</label>
      <div class="col-sm-8">
        <input class="form-control" id="user_website" name="user[website]" size="50" type="url" placeholder="http://" />
      </div>
    </div>
  `;
}

signupFormTemplate += `
  <div class="row mb-3">
    <label class="col-sm-4 col-form-label text-end" for="user_use_description">How will you use the APIs?<br />(optional)</label>
    <div class="col-sm-8">
      <textarea class="form-control" cols="40" id="user_use_description" name="user[use_description]" rows="3"></textarea>
    </div>
  </div>
`;

if(options.termsCheckbox) {
  signupFormTemplate += `
    <div class="row mb-3">
      <div class="col-sm-8 offset-sm-4">
        <div class="form-check">
          <label class="form-check-label"><input id="user_terms_and_conditions" name="user[terms_and_conditions]" type="checkbox" class="form-check-input" value="true" required data-parsley-error-message="You must agree to the terms and conditions to signup" />I have read and agree to the <a href="${escapeHtml(options.termsUrl)}" onclick="window.open(this.href, &#x27;api_umbrella_terms&#x27;, &#x27;height=500,width=790,menubar=no,toolbar=no,location=no,personalbar=no,status=no,resizable=yes,scrollbars=yes&#x27;); return false;" title="Opens new window to terms and conditions">terms and conditions</a>.</label>
        </div>
      </div>
    </div>
  `;
} else {
  signupFormTemplate += `<input type="hidden" name="user[terms_and_conditions]" value="true" />`;
}

signupFormTemplate += `
    <div class="row mb-3">
      <div class="col-sm-8 offset-sm-4">
        <input type="hidden" name="user[registration_source]" value="${escapeHtml(options.registrationSource)}" />
        <button type="submit" class="btn btn-lg btn-primary" data-loading-text="Loading...">Signup</button>
      </div>
    </div>

    <div class="modal alert-modal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-body">
            <button type="button" class="btn-close float-end" data-bs-dismiss="modal" aria-label="Close"></button>
            <div class="alert-modal-message"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
          </div>
        </div>
      </div>
    </div>
  </form>
`;

const container = document.querySelector(options.containerSelector);
container.classList.add('api-umbrella-embed');
container.innerHTML = signupFormTemplate;

const modalEl = container.querySelector('.alert-modal');
const modalMessageEl = modalEl.querySelector('.alert-modal-message');
const modal = new Modal(modalEl);

const formEl = container.querySelector('form');
formEl.addEventListener('submit', function(event) {
  event.preventDefault();

  if (!formEl.checkValidity()) {
    formEl.classList.add('was-validated')
    return false;
  }

  const submitButtonEl = formEl.querySelector('button[type=submit]');
  const submitButtonOrig = submitButtonEl.innerHTML;
  setTimeout(function() {
    submitButtonEl.disabled = true;
    submitButtonEl.innerText = 'Loading...';
  }, 0);

  const data = {
    ...serialize(formEl, { hash: true }),
    options: {
      example_api_url: options.exampleApiUrl,
      contact_url: options.contactUrl,
      site_name: options.siteName,
      send_welcome_email: options.sendWelcomeEmail,
      email_from_name: options.emailFromName,
      email_from_address: options.emailFromAddress,
      verify_email: options.verifyEmail,
    },
  };

  if (data?.user?.terms_and_conditions === 'true') {
    data.user.terms_and_conditions = true;
  }

  fetch(`${options.apiUrlRoot}/v1/users.json?api_key=${options.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  }).then(function(response) {
    const contentType = error.response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    return response.json();
  }).then(function(data) {
    if (!response.ok) {
      throw { responseData: data };
    }

    var user = data.user;

    var confirmationTemplate = '';
    if(data.options.verify_email) {
      confirmationTemplate += `
        <p>Your API key for <strong>${escapeHtml(user.email)}</strong> has been e-mailed to you. You can use your API key to begin making web service requests immediately.</p>
        <p>If you don't receive your API Key via e-mail within a few minutes, please <a href="${escapeHtml(data.options.contact_url)}">contact us</a>.</p>
      `;
    } else {
      confirmationTemplate += `
        <p>Your API key for <strong>${escapeHtml(user.email)}</strong> is:</p>
        <code class="signup-key">${escapeHtml(user.api_key)}</code>
        <p>You can start using this key to make web service requests. Simply pass your key in the URL when making a web request. Here's an example:</p>
        <pre class="signup-example"><a href="${escapeHtml(data.options.example_api_url)}">${data.options.example_api_url_formatted_html}</a></pre>
      `;
    }

    confirmationTemplate += `
      ${options.signupConfirmationMessage}
      <div class="signup-footer">
        <p>For additional support, please <a href="${escapeHtml(data.options.contact_url)}">contact us</a>. When contacting us, please tell us what API you're accessing and provide the following account details so we can quickly find you:</p>
        Account Email: ${escapeHtml(user.email)}<br>
        Account ID: ${escapeHtml(user.id)}
      </div>
    `;

    $(options.containerSelector).html(confirmationTemplate);
    $(options.containerSelector)[0].scrollIntoView();
  }).catch(function(error) {
    const messages = [];
    let messageStr = '';
    try {
      if(error?.responseData?.errors) {
        for (let i = 0; i < error.responseData.errors.length; i++) {
          const err = error.responseData.errors[i];
          if (err.full_message || err.message) {
            messages.push(escapeHtml(err.full_message || err.message));
          }
        }
      }

      if (error?.responseData?.error?.message) {
        messages.push(escapeHtml(error.responseData.error.message));
      }

      if (messages && messages.length > 0) {
        messageStr = `<br><ul><li>${messages.join('</li><li>')}</li></ul>`;
      }
    } catch(e) {
      console.error(e);
    }

    modalMessageEl.innerHTML = `API key signup unexpectedly failed.${messageStr}<br>Please try again or <a href="${escapeHtml(options.issuesUrl)}">file an issue</a> for assistance.`;
    modal.show();
  }).finally(function() {
    submitButtonEl.disabled = false;
    submitButtonEl.innerHTML = submitButtonOrig;
  });
});
