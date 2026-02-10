/* ===== LUMINARCH CLIENT HUB — AUTH + TICKET LOGIC ===== */

(function () {
  'use strict';

  /* ---------- SUPABASE INIT ---------- */
  var SUPABASE_URL = 'https://xzdoppeqdjkyfydxbpqc.supabase.co';
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZG9wcGVxZGpreWZ5ZHhicHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU3NjUsImV4cCI6MjA4NTI4MTc2NX0.sRk1kyMRKNNA3fAtqXUEg33ucGpobzdWr2gHNM5ZKpc';

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  /* ---------- HELPERS ---------- */
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  function toast(msg, type) {
    var c = $('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'hub-toast hub-toast--' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 4000);
  }

  function timeAgo(date) {
    var s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    var d = Math.floor(h / 24);
    if (d < 30) return d + 'd ago';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  var TYPE_LABELS = {
    content_update: 'Content Update',
    design_change: 'Design Change',
    bug_report: 'Bug Report',
    other: 'Other'
  };

  var STATUS_LABELS = {
    submitted: 'Submitted',
    in_review: 'In Review',
    in_progress: 'In Progress',
    deployed: 'Deployed'
  };

  /* ============================================================
     PAGE: client-hub.html (LOGIN)
     ============================================================ */
  var isLoginPage = !!$('hubCard');

  if (isLoginPage) {
    // Check if already logged in
    sb.auth.getSession().then(function (res) {
      if (res.data.session) {
        window.location.href = 'dashboard.html';
      }
    });

    // Toggle sign in / sign up views
    var viewSignIn = $('viewSignIn');
    var viewSignUp = $('viewSignUp');
    var viewMagicSent = $('viewMagicSent');

    function showView(v) {
      hide(viewSignIn); hide(viewSignUp); hide(viewMagicSent);
      show(v);
    }

    var showSignUpLink = $('showSignUp');
    var showSignInLink = $('showSignIn');
    var backToSignInLink = $('backToSignIn');

    if (showSignUpLink) showSignUpLink.addEventListener('click', function (e) { e.preventDefault(); showView(viewSignUp); });
    if (showSignInLink) showSignInLink.addEventListener('click', function (e) { e.preventDefault(); showView(viewSignIn); });
    if (backToSignInLink) backToSignInLink.addEventListener('click', function (e) { e.preventDefault(); showView(viewSignIn); });

    // Sign In with password
    var formSignIn = $('formSignIn');
    if (formSignIn) {
      formSignIn.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = $('si-email').value.trim();
        var password = $('si-password').value;
        var btn = formSignIn.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Signing in...';

        sb.auth.signInWithPassword({ email: email, password: password })
          .then(function (res) {
            if (res.error) {
              toast(res.error.message, 'error');
              btn.disabled = false;
              btn.innerHTML = 'Sign In <span class="btn-arrow">&rarr;</span>';
            } else {
              window.location.href = 'dashboard.html';
            }
          });
      });
    }

    // Magic Link
    var formMagicLink = $('formMagicLink');
    if (formMagicLink) {
      formMagicLink.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = $('ml-email').value.trim();
        var btn = formMagicLink.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        sb.auth.signInWithOtp({
          email: email,
          options: { emailRedirectTo: window.location.origin + '/dashboard.html' }
        }).then(function (res) {
          if (res.error) {
            toast(res.error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Send Magic Link <span class="btn-arrow">&rarr;</span>';
          } else {
            $('magicEmailDisplay').textContent = email;
            showView(viewMagicSent);
          }
        });
      });
    }

    // Sign Up
    var formSignUp = $('formSignUp');
    if (formSignUp) {
      formSignUp.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = $('su-name').value.trim();
        var email = $('su-email').value.trim();
        var password = $('su-password').value;
        var btn = formSignUp.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Creating account...';

        sb.auth.signUp({
          email: email,
          password: password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin + '/dashboard.html'
          }
        }).then(function (res) {
          if (res.error) {
            toast(res.error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Create Account <span class="btn-arrow">&rarr;</span>';
          } else if (res.data.user && !res.data.session) {
            // Email confirmation required
            toast('Check your email to confirm your account.', 'success');
            showView(viewSignIn);
            // Notify LuminArch of new sign-up
            notifyNewSignUp(name, email);
          } else {
            window.location.href = 'dashboard.html';
            notifyNewSignUp(name, email);
          }
        });
      });
    }

    // Notify admin of new sign-up via Formspree
    function notifyNewSignUp(name, email) {
      var data = new FormData();
      data.append('name', '[Client Hub] New Sign-Up');
      data.append('email', email);
      data.append('message', 'New Client Hub registration:\n\nName: ' + name + '\nEmail: ' + email + '\nTime: ' + new Date().toLocaleString() + '\n\nThis user needs approval before they can submit tickets. Log into Supabase to approve them.');
      data.append('_subject', 'New Client Hub Sign-Up: ' + name);
      fetch('https://formspree.io/f/xzdabyeo', { method: 'POST', body: data }).catch(function () {});
    }

    return; // Stop here for login page
  }

  /* ============================================================
     PAGE: dashboard.html (AUTHENTICATED DASHBOARD)
     ============================================================ */
  var isDashboard = !!$('dashContent');
  if (!isDashboard) return;

  var currentUser = null;
  var isApproved = false;
  var pendingFiles = [];

  // Auth guard — redirect if not logged in
  sb.auth.getSession().then(function (res) {
    if (!res.data.session) {
      window.location.href = 'client-hub.html';
      return;
    }
    currentUser = res.data.session.user;
    checkApprovalThenInit();
  });

  // Listen for auth changes (e.g., magic link callback)
  sb.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session && !currentUser) {
      currentUser = session.user;
      checkApprovalThenInit();
    }
    if (event === 'SIGNED_OUT') {
      window.location.href = 'client-hub.html';
    }
  });

  function checkApprovalThenInit() {
    // Check user_profiles for approval status
    sb.from('user_profiles')
      .select('approved')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(function (res) {
        if (res.data && res.data.approved) {
          isApproved = true;
          initDashboard();
        } else {
          // Not approved — show pending state
          showPendingApproval();
        }
      });
  }

  function showPendingApproval() {
    var content = $('dashContent');
    var footer = $('dashFooter');
    if (content) content.classList.add('dash-ready');
    if (footer) footer.classList.add('dash-ready');

    var pageFade = document.querySelector('.page-fade');
    if (pageFade && !pageFade.classList.contains('done')) {
      pageFade.classList.add('done');
    }

    // Replace dashboard content with pending message
    var pendingEl = $('dashPending');
    var mainContent = $('dashMain');
    if (pendingEl) pendingEl.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';

    // Set user name
    var nameEl = $('pendingName');
    var meta = currentUser.user_metadata || {};
    var displayName = meta.full_name || meta.name || currentUser.email.split('@')[0];
    if (nameEl) nameEl.textContent = displayName;

    // Wire sign out on pending page
    var btnPendingSignOut = $('btnPendingSignOut');
    if (btnPendingSignOut) {
      btnPendingSignOut.addEventListener('click', function () {
        sb.auth.signOut().then(function () {
          window.location.href = 'client-hub.html';
        });
      });
    }
  }

  function initDashboard() {
    // Show dashboard content + footer (hidden during auth check)
    var content = $('dashContent');
    var footer = $('dashFooter');
    if (content) content.classList.add('dash-ready');
    if (footer) footer.classList.add('dash-ready');

    // Dismiss page-fade if scripts.js hasn't already
    var pageFade = document.querySelector('.page-fade');
    if (pageFade && !pageFade.classList.contains('done')) {
      pageFade.classList.add('done');
    }

    // Set user name
    var nameEl = $('userName');
    var meta = currentUser.user_metadata || {};
    var displayName = meta.full_name || meta.name || currentUser.email.split('@')[0];
    if (nameEl) nameEl.textContent = displayName;

    // Member since
    var sinceEl = $('statSince');
    if (sinceEl) {
      var created = new Date(currentUser.created_at);
      sinceEl.textContent = created.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Load tickets
    loadTickets();

    // Wire up sign out
    var btnSignOut = $('btnSignOut');
    if (btnSignOut) {
      btnSignOut.addEventListener('click', function () {
        sb.auth.signOut().then(function () {
          window.location.href = 'client-hub.html';
        });
      });
    }

    // Wire up new request form toggle
    var btnNew = $('btnNewRequest');
    var formWrap = $('newRequestForm');
    var btnCancel = $('btnCancelRequest');

    if (btnNew && formWrap) {
      btnNew.addEventListener('click', function () {
        hide(btnNew);
        formWrap.style.display = 'block';
        formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (btnCancel && formWrap && btnNew) {
      btnCancel.addEventListener('click', function () {
        formWrap.style.display = 'none';
        show(btnNew);
        pendingFiles = [];
        updateFileList();
      });
    }

    // Wire up file upload
    var dropzone = $('dropzone');
    var fileInput = $('tk-files');
    var browseBtn = $('browseFiles');

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', function () { fileInput.click(); });
    }
    if (dropzone) {
      dropzone.addEventListener('click', function (e) {
        if (e.target === dropzone || e.target.classList.contains('dash-dropzone__text')) {
          fileInput.click();
        }
      });
      dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover'); });
      dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover'); });
      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        addFiles(e.dataTransfer.files);
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        addFiles(fileInput.files);
        fileInput.value = '';
      });
    }

    // Submit new ticket
    var formTicket = $('formNewTicket');
    if (formTicket) {
      formTicket.addEventListener('submit', function (e) {
        e.preventDefault();
        submitTicket();
      });
    }
  }

  /* ---------- FILE HANDLING ---------- */
  function addFiles(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (f.size > 10 * 1024 * 1024) {
        toast(f.name + ' exceeds 10MB limit', 'error');
        continue;
      }
      pendingFiles.push(f);
    }
    updateFileList();
  }

  function updateFileList() {
    var list = $('fileList');
    if (!list) return;
    list.innerHTML = '';
    pendingFiles.forEach(function (f, idx) {
      var item = document.createElement('div');
      item.className = 'dash-dropzone__item';
      var sizeKB = (f.size / 1024).toFixed(0);
      item.innerHTML = '<span>' + f.name + ' <span style="color:var(--gray-light)">(' + sizeKB + ' KB)</span></span>' +
        '<button type="button" class="dash-dropzone__remove" data-idx="' + idx + '">&times;</button>';
      list.appendChild(item);
    });
    list.querySelectorAll('.dash-dropzone__remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pendingFiles.splice(parseInt(btn.dataset.idx), 1);
        updateFileList();
      });
    });
  }

  /* ---------- SUBMIT TICKET ---------- */
  function submitTicket() {
    var type = $('tk-type').value;
    var subject = $('tk-subject').value.trim();
    var url = $('tk-url').value.trim();
    var desc = $('tk-desc').value.trim();
    var priority = document.querySelector('input[name="priority"]:checked').value;

    if (!type || !subject || !desc) {
      toast('Please fill in all required fields.', 'error');
      return;
    }

    var btn = document.querySelector('#formNewTicket button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    // Insert ticket
    sb.from('support_tickets').insert({
      user_id: currentUser.id,
      client_name: (currentUser.user_metadata || {}).full_name || currentUser.email,
      website_url: url || null,
      request_type: type,
      subject: subject,
      description: desc,
      priority: priority
    }).select().single().then(function (res) {
      if (res.error) {
        toast('Failed to submit: ' + res.error.message, 'error');
        btn.disabled = false;
        btn.innerHTML = 'Submit Request <span class="btn-arrow">&rarr;</span>';
        return;
      }

      var ticket = res.data;

      // Upload files if any
      if (pendingFiles.length > 0) {
        uploadFiles(ticket.id, function () {
          finishSubmit();
        });
      } else {
        finishSubmit();
      }

      function finishSubmit() {
        toast('Request submitted! We\'ll get on it.', 'success');
        // Reset form
        $('formNewTicket').reset();
        pendingFiles = [];
        updateFileList();
        $('newRequestForm').style.display = 'none';
        show($('btnNewRequest'));
        btn.disabled = false;
        btn.innerHTML = 'Submit Request <span class="btn-arrow">&rarr;</span>';
        // Reload tickets
        loadTickets();
      }
    });
  }

  /* ---------- FILE UPLOAD ---------- */
  function uploadFiles(ticketId, callback) {
    var remaining = pendingFiles.length;
    if (remaining === 0) { callback(); return; }

    pendingFiles.forEach(function (file) {
      var path = currentUser.id + '/' + ticketId + '/' + Date.now() + '_' + file.name;

      sb.storage.from('ticket-files').upload(path, file).then(function (res) {
        if (res.error) {
          toast('Upload failed: ' + file.name, 'error');
        } else {
          // Record attachment
          sb.from('ticket_attachments').insert({
            ticket_id: ticketId,
            user_id: currentUser.id,
            file_name: file.name,
            file_path: path,
            file_size: file.size
          }).then(function () {});
        }
        remaining--;
        if (remaining === 0) callback();
      });
    });
  }

  /* ---------- LOAD TICKETS ---------- */
  function loadTickets() {
    var feed = $('ticketFeed');
    var loading = $('feedLoading');
    var empty = $('feedEmpty');

    show(loading);
    hide(empty);

    sb.from('support_tickets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .then(function (res) {
        hide(loading);

        if (res.error) {
          toast('Failed to load tickets: ' + res.error.message, 'error');
          return;
        }

        var tickets = res.data || [];

        // Update stats
        var active = 0, deployed = 0;
        tickets.forEach(function (t) {
          if (t.status === 'deployed') deployed++;
          else active++;
        });
        var statActive = $('statActive');
        var statDeployed = $('statDeployed');
        if (statActive) statActive.textContent = active;
        if (statDeployed) statDeployed.textContent = deployed;

        // Clear existing ticket cards (keep loading div)
        var existing = feed.querySelectorAll('.dash-ticket');
        existing.forEach(function (el) { el.remove(); });

        if (tickets.length === 0) {
          show(empty);
          return;
        }
        hide(empty);

        tickets.forEach(function (ticket, idx) {
          var card = buildTicketCard(ticket, idx + 1);
          feed.appendChild(card);
        });

        // Load attachments for all tickets
        loadAllAttachments(tickets);
      });
  }

  /* ---------- BUILD TICKET CARD ---------- */
  function buildTicketCard(ticket, num) {
    var card = document.createElement('div');
    card.className = 'dash-ticket';
    card.dataset.id = ticket.id;

    var typeLabel = TYPE_LABELS[ticket.request_type] || ticket.request_type;
    var statusLabel = STATUS_LABELS[ticket.status] || ticket.status;
    var statusClass = 'dash-status--' + ticket.status.replace('_', '-');
    var time = timeAgo(ticket.created_at);
    var priorityBadge = ticket.priority === 'urgent'
      ? '<span class="dash-priority-badge">Urgent</span>' : '';

    card.innerHTML =
      '<div class="dash-ticket__header">' +
        '<div class="dash-ticket__meta">' +
          '<span class="dash-ticket__num">#' + num + '</span>' +
          '<span class="dash-ticket__type">' + typeLabel + '</span>' +
          '<span class="dash-ticket__time">' + time + '</span>' +
          priorityBadge +
        '</div>' +
        '<span class="dash-status ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="dash-ticket__subject">' + escHtml(ticket.subject) + '</div>' +
      '<div class="dash-ticket__expand">' +
        '<div class="dash-ticket__body">' +
          '<div class="dash-ticket__desc">' + escHtml(ticket.description).replace(/\n/g, '<br>') + '</div>' +
          (ticket.website_url ? '<p class="dash-ticket__url"><span class="label" style="color:var(--gray-light)">Website:</span> ' + escHtml(ticket.website_url) + '</p>' : '') +
          (ticket.admin_notes ? '<div class="dash-ticket__admin-note"><span class="label accent-text">Admin Update</span><p>' + escHtml(ticket.admin_notes).replace(/\n/g, '<br>') + '</p></div>' : '') +
          '<div class="dash-ticket__attachments" id="attach-' + ticket.id + '"></div>' +
        '</div>' +
      '</div>';

    // Toggle expand
    card.querySelector('.dash-ticket__header').addEventListener('click', function () {
      card.classList.toggle('expanded');
    });
    card.querySelector('.dash-ticket__subject').addEventListener('click', function () {
      card.classList.toggle('expanded');
    });

    return card;
  }

  function escHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ---------- LOAD ATTACHMENTS ---------- */
  function loadAllAttachments(tickets) {
    var ids = tickets.map(function (t) { return t.id; });

    sb.from('ticket_attachments')
      .select('*')
      .in('ticket_id', ids)
      .order('created_at', { ascending: true })
      .then(function (res) {
        if (res.error || !res.data) return;

        res.data.forEach(function (att) {
          var container = document.getElementById('attach-' + att.ticket_id);
          if (!container) return;

          // Show header if first attachment
          if (!container.querySelector('.dash-attach-header')) {
            var header = document.createElement('span');
            header.className = 'label dash-attach-header';
            header.style.color = 'var(--gray-light)';
            header.style.marginTop = '12px';
            header.style.display = 'block';
            header.textContent = 'Attachments';
            container.appendChild(header);
          }

          var link = document.createElement('a');
          link.className = 'dash-attach-link';
          link.textContent = att.file_name;
          link.href = '#';
          link.addEventListener('click', function (e) {
            e.preventDefault();
            sb.storage.from('ticket-files').createSignedUrl(att.file_path, 300).then(function (r) {
              if (r.data) window.open(r.data.signedUrl, '_blank');
              else toast('Could not generate download link', 'error');
            });
          });
          container.appendChild(link);
        });
      });
  }

})();
