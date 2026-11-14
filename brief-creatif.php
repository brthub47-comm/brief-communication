<?php
/**
 * Plugin Name: Brief créatif
 * Description: Assistant en 8 étapes pour préparer un brief créatif. Shortcode : [brief_creatif endpoint="https://script.google.com/macros/s/…/exec" token="…" logo="https://…/logo.svg" name="Ma structure"]
 * Version: 1.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('BRIEF_CREATIF_VERSION', '1.1.0');

add_action('wp_enqueue_scripts', function () {
    wp_register_style(
        'brief-creatif',
        plugins_url('assets/brief.css', __FILE__),
        array(),
        BRIEF_CREATIF_VERSION
    );
    wp_register_script(
        'brief-creatif',
        plugins_url('assets/brief.js', __FILE__),
        array(),
        BRIEF_CREATIF_VERSION,
        true
    );
});

add_shortcode('brief_creatif', function ($atts) {
    $atts = shortcode_atts(array('email' => '', 'endpoint' => '', 'token' => '', 'logo' => '', 'name' => ''), $atts, 'brief_creatif');

    wp_enqueue_style('brief-creatif');
    wp_enqueue_script('brief-creatif');
    wp_add_inline_script(
        'brief-creatif',
        'window.BRIEF_CREATIF_CONFIG = ' . wp_json_encode(array(
            'contactEmail' => sanitize_email($atts['email']),
            'endpoint' => esc_url_raw($atts['endpoint']),
            'token' => sanitize_text_field($atts['token']),
            'logo' => esc_url_raw($atts['logo']),
            'brandName' => sanitize_text_field($atts['name']),
        )) . ';',
        'before'
    );

    return '<div id="brief-app">'
        . '<header class="bc-no-print">'
        . '<h2 class="bc-title">Préparer votre brief créatif</h2>'
        . '<p class="bc-intro">Huit étapes pour clarifier votre projet d\'identité. Vos réponses restent dans votre navigateur tant que vous n’envoyez pas le brief.</p>'
        . '</header>'
        . '<div id="bc-prog" class="bc-prog bc-no-print" aria-hidden="true"></div>'
        . '<div id="bc-step" aria-live="polite"></div>'
        . '<div id="bc-nav" class="bc-no-print"></div>'
        . '<noscript><p>Cet outil nécessite JavaScript.</p></noscript>'
        . '</div>';
});