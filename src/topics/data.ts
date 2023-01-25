
import validator from 'validator';
import db from '../database';
import categories from '../categories';
import utils from '../utils';
import translator from '../translator';
import plugins from '../plugins';
import { TagObject, TopicObject } from '../types';

const intFields = [
    'tid', 'cid', 'uid', 'mainPid', 'postcount',
    'viewcount', 'postercount', 'deleted', 'locked', 'pinned',
    'pinExpiry', 'timestamp', 'upvotes', 'downvotes', 'lastposttime',
    'deleterUid',
];

function escapeTitle(topicData: TopicObject) {
    if (topicData) {
        if (topicData.title) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topicData.title = translator.escape(validator.escape(topicData.title));
        }
        if (topicData.titleRaw) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topicData.titleRaw = String(translator.escape(topicData.titleRaw));
        }
    }
}

function modifyTopic(topic: TopicObject, fields: string[]): TagObject {
    if (!topic) {
        return;
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    db.parseIntFields(topic, intFields, fields);

    if (topic.hasOwnProperty('title')) {
        topic.titleRaw = topic.title;
        topic.title = String(topic.title);
    }

    escapeTitle(topic);

    if (topic.hasOwnProperty('timestamp')) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        topic.timestampISO = Number(utils.toISOString(topic.timestamp));
        if (!fields.length || fields.includes('scheduled')) {
            topic.scheduled = (topic.timestamp > Date.now().toString()).toString();
        }
    }

    if (topic.hasOwnProperty('lastposttime')) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        topic.lastposttimeISO = Number(utils.toISOString(topic.lastposttime));
    }

    if (topic.hasOwnProperty('pinExpiry')) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const res = String(utils.toISOString(topic.pinExpiry));
        topic.pinExpiryISO = res;
    }

    if (topic.hasOwnProperty('upvotes') && topic.hasOwnProperty('downvotes')) {
        topic.votes = (Number(topic.upvotes) - Number(topic.downvotes)).toString();
    }

    if (fields.includes('teaserPid') || !fields.length) {
        topic.teaserPid = topic.teaserPid || null;
    }

    if (fields.includes('tags') || !fields.length) {
        const tags = String(topic.tags || '');
        topic.tags = tags.split(',').filter(Boolean).map((tag) => {
            const escaped = validator.escape(String(tag));
            return {
                value: tag,
                valueEscaped: escaped,
                valueEncoded: encodeURIComponent(escaped),
                class: escaped.replace(/\s/g, '-'),
                score: 0,
                color: '',
                bgColor: '',
            };
        });
    }
}

interface result {
    tids: number[];
    topics: TopicObject[];
    fields: string[];
    keys: string[];
}

export default function default_1(Topics: TopicObject) {
    Topics.getTopicsFields = async function (tids: number[], fields: string[]) {
        if (!Array.isArray(tids) || !tids.length) {
            const empty: Promise<TopicObject>[] = [];
            return empty;
            // return [];
        }

        // "scheduled" is derived from "timestamp"
        if (fields.includes('scheduled') && !fields.includes('timestamp')) {
            fields.push('timestamp');
        }

        const keys: string[] = tids.map(tid => `topic:${tid}`);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topics: TopicObject[] = await db.getObjects(keys, fields);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        // const result: result = await plugins.hooks.fire('filter:topic.getFields', {
        //     tids: tids,
        //     topics: topics,
        //     fields: fields,
        //     keys: keys,
        // });
        const result2: result = {tids: tids, topics: topics, fields: fields, keys: keys};
        result2.topics.forEach(topic => modifyTopic(topic, fields));
        return result2.topics;
    };

    Topics.getTopicField = async function (tid: number, field: string) {
        const topic : TopicObject = await Topics.getTopicFields(tid, [field]);
        return topic ? topic[field] : null;
    };

    Topics.getTopicFields = async function (tid: number, fields: string[]) {
        const topics : TopicObject[] | Promise<TopicObject>[] = await Topics.getTopicsFields([tid], fields);
        return topics ? topics[0] : null;
    };

    Topics.getTopicData = async function (tid: number) {
        const topics : TopicObject[] | Promise<TopicObject>[] = await Topics.getTopicsFields([tid], []);
        return topics && topics.length ? topics[0] : null;
    };

    Topics.getTopicsData = async function (tids: number[]) {
        return await Topics.getTopicsFields(tids, []);
    };

    Topics.getCategoryData = async function (tid: number) {
        const cid: TopicObject = await Topics.getTopicField(tid, 'cid');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await categories.getCategoryData(cid);
    };

    Topics.setTopicField = async function (tid: number, field: string, value: number) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.setObjectField(`topic:${tid}`, field, value);
    };

    Topics.setTopicFields = async function (tid: number, data: number[]) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.setObject(`topic:${tid}`, data);
    };

    Topics.deleteTopicField = async function (tid: number, field: string) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectField(`topic:${tid}`, field);
    };

    Topics.deleteTopicFields = async function (tid: number, fields: string[]) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectFields(`topic:${tid}`, fields);
    };
}
