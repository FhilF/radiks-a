"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const keys_1 = require("blockstack/lib/keys");
const model_1 = require("../model");
const group_membership_1 = require("./group-membership");
const group_invitation_1 = require("./group-invitation");
const signing_key_1 = require("./signing-key");
const helpers_1 = require("../helpers");
const defaultMembers = [];
class UserGroup extends model_1.default {
    static async find(id) {
        const { userGroups, signingKeys } = group_membership_1.default.userGroupKeys();
        if (!userGroups || !userGroups[id]) {
            throw new Error(`UserGroup not found with id: '${id}'. Have you called \`GroupMembership.cacheKeys()\`?`);
        }
        const signingKey = userGroups[id];
        const privateKey = signingKeys[signingKey];
        const userGroup = new this({ _id: id });
        userGroup.privateKey = privateKey;
        await userGroup.fetch();
        return userGroup;
    }
    async create() {
        const signingKey = await signing_key_1.default.create({ userGroupId: this._id });
        this.attrs.signingKeyId = signingKey._id;
        this.privateKey = signingKey.attrs.privateKey;
        helpers_1.addUserGroupKey(this);
        // await this.makeGaiaConfig();
        const { username } = helpers_1.loadUserData();
        const invitation = await this.makeGroupMembership(username);
        await invitation.activate();
        return this;
    }
    async makeGroupMembership(username) {
        let existingInviteId = null;
        this.attrs.members.forEach((member) => {
            if (member.username === username) {
                existingInviteId = member.inviteId;
            }
        });
        if (existingInviteId) {
            const invitation = await group_invitation_1.default.findById(existingInviteId, { decrypt: false });
            return invitation;
        }
        const invitation = await group_invitation_1.default.makeInvitation(username, this);
        this.attrs.members.push({
            username,
            inviteId: invitation._id,
        });
        await this.save();
        return invitation;
    }
    static myGroups() {
        const { userGroups } = helpers_1.userGroupKeys();
        const keys = Object.keys(userGroups);
        return this.fetchList({ _id: keys.join(',') });
    }
    publicKey() {
        return keys_1.getPublicKeyFromPrivate(this.privateKey);
    }
    async encryptionPublicKey() {
        return this.publicKey();
    }
    encryptionPrivateKey() {
        if (this.privateKey) {
            return this.privateKey;
        }
        const { signingKeys } = helpers_1.userGroupKeys();
        return signingKeys[this.attrs.signingKeyId];
    }
    getSigningKey() {
        const { userGroups, signingKeys } = helpers_1.userGroupKeys();
        const id = userGroups[this._id];
        const privateKey = signingKeys[id];
        return {
            privateKey,
            id,
        };
    }
}
exports.default = UserGroup;
UserGroup.schema = {
    name: String,
    gaiaConfig: Object,
    members: {
        type: Array,
    },
};
UserGroup.defaults = {
    members: defaultMembers,
};
// async makeGaiaConfig() {
//   const userData = loadUserData();
//   const { appPrivateKey, hubUrl } = userData;
//   const scopes = [
//     {
//       scope: 'putFilePrefix',
//       domain: `UserGroups/${this._id}/`,
//     },
//   ];
//   const userSession = requireUserSession();
//   const gaiaConfig = await userSession.connectToGaiaHub(hubUrl, appPrivateKey, scopes);
//   this.attrs.gaiaConfig = gaiaConfig;
//   return gaiaConfig;
// }
UserGroup.modelName = () => 'UserGroup';
