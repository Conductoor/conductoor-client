/* global TimesheetBubble */
var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
var ONE_DAY = 1000 * 60 * 60 * 24;
(function() {
  'use strict';

  /**
   * Initialize a Timesheet
   */
  var Timesheet = function(container, min, max, data) {
    this.data = [];
    this.year = {
      start_date: min,
      min: 0,
      // + 1 to make the title fit
      max: (Math.ceil(Math.abs(max-min) / ONE_WEEK) + 1)
    };
    // if duration too long -> 1 week sections to 4 week
    this.divider = (this.year.max) < 30 ? 1 : 4;
    this.parse(data || []);


    if (typeof document !== 'undefined') {
      this.container = (typeof container === 'string') ? document.querySelector("") : container;
      var that = this;
      this.drawSections();
      setTimeout(function(){ that.insertData(); }, 0);
    }
  };

  /**
   * Insert data into Timesheet
   */
  Timesheet.prototype.insertData = function() {
    var html = [];
    var widthMonth = this.container.querySelector('.scale section').offsetWidth;
    // var widthMonth = 93;
    for (var n = 0, m = this.data.length; n < m; n++) {
      var cur = this.data[n];
      var bubble = new Bubble(widthMonth, this.year.start_date, cur.start, cur.end, this.divider );
      console.log(cur.type);
      if (cur.type === "#null") {
        cur.type = "";
      }
      var line = [
        '<span style="background-color:'+(cur.type || '#000')+'; margin-left: ' + bubble.getStartOffset() + 'px; width: ' + bubble.getWidth() + 'px;" class="bubble" data-duration="' + (cur.end ? Math.round((cur.end-cur.start)/1000/60/60/24/39) : '') + '"></span>',
        '<span class="label">' + cur.label + '</span> ',
        '<span class="date">' + bubble.getDateLabel() + '</span>'

      ].join('');

      html.push('<li>' + line + '</li>');
    }

    this.container.innerHTML += '<ul class="data">' + html.join('') + '</ul>';
  };

  /**
   * Draw section labels
   */
  Timesheet.prototype.drawSections = function() {
    var html = [];
    if (this.divider === 1) {
      for (var c = this.year.min; c <= this.year.max; c++) {
        html.push('<section horizontal around-justified layout flex>' +
          '<div>' +"w" + (c+1) +
          '</div>' +
          '</section>');
      }
    } else {
      for (var c = this.year.min; c <= this.year.max; c+=4) {
        html.push('<section horizontal around-justified layout flex>' +
          '<div>' +"w" + (c+1) +
          '</div>' +
          '<div>' +" – " +
          '</div>' +
          '<div>' +"w" + (c+4)  +
          '</div>' +
          '</section>');
      }
    }

    this.container.className = 'timesheet color-scheme-default';
    this.container.innerHTML = '<div class="scale" layout horizontal fit>' + html.join('') + '</div>';
  };

  /**
   * Parse data string
   */
  Timesheet.prototype.parseDate = function(date) {
    if (date.indexOf('/') === -1) {
      date = new Date(parseInt(date, 10), 0, 1);
      date.hasMonth = false;
    } else {
      date = date.split('/');
      date = new Date(parseInt(date[1], 10), parseInt(date[0], 10)-1, 1);
      date.hasMonth = true;
    }

    return date;
  };

  /**
   * Parse passed data
   */
  Timesheet.prototype.parse = function(data) {
    for (var n = 0, m = data.length; n<m; n++) {
      var beg = data[n][0];
      // var beg = this.parseDate(data[n][0]);
      var end = data[n][1];
      // var end = data[n].length === 4 ? this.parseDate(data[n][1]) : null;
      var lbl = data[n][2];
      var cat = data[n][3];

      // if (beg.getFullYear() < this.year.min) {
      //   this.year.min = beg.getFullYear();
      // }

      // if (end && end.getFullYear() > this.year.max) {
      //   this.year.max = end.getFullYear();
      // } else if (beg.getFullYear() > this.year.max) {
      //   this.year.max = beg.getFullYear();
      // }

      this.data.push({start: beg, end: end, label: lbl, type: cat});
    }
  };

  /**
   * Timesheet Bubble
   */
  var Bubble = function(wMonth, start_date, start, end, divider) {
    //start_date = When the project started
    this.project_start_date = start_date ;
    this.start = start;
    this.end = end;
    this.widthMonth = wMonth;
    this.divider = divider;
  };

  /**
   * Format month number
   */
  Bubble.prototype.formatMonth = function(num) {
    num = parseInt(num, 10);

    return num >= 10 ? num : '0' + num;
  };

  /**
   * Calculate starting offset for bubble
   */
  Bubble.prototype.getStartOffset = function() {
    // return (this.widthMonth/this.divider) * (this.start);
    return (this.widthMonth/(this.divider*7)) * (Math.abs(this.start-this.project_start_date) / ONE_DAY);
    // return (this.widthMonth/12) * (12 * (this.start.getFullYear() - this.min) +
      // this.start.getMonth());
  };

  /**
   * Get count of full years from start to end
   */
  Bubble.prototype.getFullYears = function() {
    return ((this.end && this.end.getFullYear()) || this.start.getFullYear()) -
    this.start.getFullYear();
  };

  /**
   * Get count of all months in Timesheet Bubble
   */
  Bubble.prototype.getMonths = function() {
    var fullYears = this.getFullYears();
    var months = 0;

    if (!this.end) {
      months += !this.start.hasMonth ? 12 : 1;
    } else {
      if (!this.end.hasMonth) {
        months += 12 - (this.start.hasMonth ? this.start.getMonth() : 0);
        months += 12 * (fullYears-1 > 0 ? fullYears-1 : 0);
      } else {
        months += this.end.getMonth() + 1;
        months += 12 - (this.start.hasMonth ? this.start.getMonth() : 0);
        months += 12 * (fullYears-1);
      }
    }

    return months;
  };

  /**
   * Get bubble's width in pixel
   */
  Bubble.prototype.getWidth = function() {
    // return (this.widthMonth/this.divider) * (this.end - this.start);
    return (this.widthMonth/(this.divider*7)) * (Math.ceil(Math.abs(this.end - this.start) / ONE_DAY));

    // return (this.widthMonth/12) * this.getMonths();

  };

  /**
   * Get the bubble's label
   */
  Bubble.prototype.getDateLabel = function() {
    return [this.start.getDate() + "/" + (this.start.getMonth() + 1) + "/" + this.start.getFullYear(),
            this.end.getDate() + "/" + (this.end.getMonth() + 1) + "/" + this.end.getFullYear()].join(' - ');
  };

  window.Timesheet = Timesheet;
})();